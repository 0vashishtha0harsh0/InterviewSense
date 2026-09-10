import cv2
import os
import logging
import numpy as np
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Singleton mediapipe models
_face_detection = None
_face_mesh = None

def get_face_detection():
    global _face_detection
    if _face_detection is None:
        import mediapipe as mp
        mp_face_detection = mp.solutions.face_detection
        _face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)
        logger.info("MediaPipe FaceDetection loaded")
    return _face_detection

def get_face_mesh():
    global _face_mesh
    if _face_mesh is None:
        import mediapipe as mp
        mp_face_mesh = mp.solutions.face_mesh
        _face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        logger.info("MediaPipe FaceMesh loaded")
    return _face_mesh

def estimate_blink(landmarks, w, h) -> bool:
    """
    Estimate blink using Eye Aspect Ratio (EAR) from FaceMesh landmarks.
    Landmark indices: left eye: 159 (upper), 145 (lower), 33 (left), 133 (right)
                     right eye: 386 (upper), 374 (lower), 362 (left), 263 (right)
    Returns True if blink detected.
    """
    try:
        def ear(upper_idx, lower_idx, left_idx, right_idx):
            upper = np.array([landmarks[upper_idx].x * w, landmarks[upper_idx].y * h])
            lower = np.array([landmarks[lower_idx].x * w, landmarks[lower_idx].y * h])
            left = np.array([landmarks[left_idx].x * w, landmarks[left_idx].y * h])
            right = np.array([landmarks[right_idx].x * w, landmarks[right_idx].y * h])
            vertical = np.linalg.norm(upper - lower)
            horizontal = np.linalg.norm(left - right)
            if horizontal == 0: return 1.0
            return vertical / horizontal
        left_ear = ear(159, 145, 33, 133)
        right_ear = ear(386, 374, 362, 263)
        avg_ear = (left_ear + right_ear) / 2
        return avg_ear < 0.22  # threshold tuned for blink
    except Exception as e:
        return False

def analyze_video(video_path: str, sample_every: int = 5, max_frames: int = 60) -> Dict:
    """
    Analyze video for non-verbal behavior. Samples frames, reduced resolution.
    Returns dict with face_presence, eye_contact, blink_rate, movement_indicator, delivery_score
    All scores 0-100, plus raw counts.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    fps = cap.get(cv2.CAP_PROP_FPS) or 15
    # Sample logic: every Nth frame, limited to max_frames
    sampled = 0
    face_present = 0
    eye_contact_hits = 0
    blink_count = 0
    prev_nose = None
    movement_sum = 0.0
    face_sizes = []

    # Prepare detectors
    try:
        face_detection = get_face_detection()
        face_mesh = get_face_mesh()
    except Exception as e:
        logger.warning(f"MediaPipe init failed fallback to Haar: {e}")
        face_detection = None
        face_mesh = None

    # Haar fallback
    haar_cascade = None
    if face_detection is None:
        haar_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if os.path.exists(haar_path):
            haar_cascade = cv2.CascadeClassifier(haar_path)

    frame_idx = 0
    processed = 0
    blink_state = False  # to count blink transitions

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1
        if frame_idx % sample_every != 0:
            continue
        if processed >= max_frames:
            break
        processed += 1
        # Reduce resolution to 320 width for performance
        h, w = frame.shape[:2]
        if w > 320:
            scale = 320 / w
            new_w, new_h = 320, int(h * scale)
            frame_small = cv2.resize(frame, (new_w, new_h))
        else:
            frame_small = frame
            new_w, new_h = w, h

        # Convert to RGB for mediapipe
        rgb = cv2.cvtColor(frame_small, cv2.COLOR_BGR2RGB)
        face_found = False
        landmarks = None

        # Try MediaPipe FaceDetection
        if face_detection is not None:
            fd_results = face_detection.process(rgb)
            if fd_results.detections:
                face_found = True
                # Eye contact estimate: face centered? Use bounding box
                det = fd_results.detections[0]
                bbox = det.location_data.relative_bounding_box
                # bbox xmin, ymin, width, height are relative 0-1
                cx = bbox.xmin + bbox.width / 2
                cy = bbox.ymin + bbox.height / 2
                # Eye contact if face center within central 40% (0.3-0.7)
                if 0.3 <= cx <= 0.7 and 0.3 <= cy <= 0.7:
                    eye_contact_hits += 1
                # Track face size
                face_sizes.append(bbox.width * bbox.height)

        # Try FaceMesh for landmarks (more precise)
        if face_mesh is not None:
            fm_results = face_mesh.process(rgb)
            if fm_results.multi_face_landmarks:
                face_found = True
                lm = fm_results.multi_face_landmarks[0].landmark
                landmarks = lm
                # Blink detection
                is_blink = estimate_blink(lm, new_w, new_h)
                if is_blink and not blink_state:
                    blink_count += 1
                    blink_state = True
                elif not is_blink:
                    blink_state = False
                # Movement via nose tip (landmark 1)
                nose = lm[1]
                nose_pos = np.array([nose.x * new_w, nose.y * new_h])
                if prev_nose is not None:
                    movement_sum += np.linalg.norm(nose_pos - prev_nose)
                prev_nose = nose_pos
                # Eye contact via head pose: nose near center
                if not face_found: # if detection missed but mesh found, estimate eye contact similarly
                    cx = nose.x
                    cy = nose.y
                    if 0.35 <= cx <= 0.65 and 0.35 <= cy <= 0.65:
                        eye_contact_hits += 1
            else:
                # No face mesh, reset blink state
                blink_state = False
        elif haar_cascade is not None and not face_found:
            # Haar fallback
            gray = cv2.cvtColor(frame_small, cv2.COLOR_BGR2GRAY)
            faces = haar_cascade.detectMultiScale(gray, 1.1, 4)
            if len(faces) > 0:
                face_found = True
                x, y, w_f, h_f = faces[0]
                cx = (x + w_f/2) / new_w
                cy = (y + h_f/2) / new_h
                if 0.3 <= cx <= 0.7 and 0.3 <= cy <= 0.7:
                    eye_contact_hits += 1

        if face_found:
            face_present += 1
        sampled += 1

    cap.release()

    if sampled == 0:
        # No frames processed - maybe video corrupt or unsupported codec
        logger.warning(f"No frames sampled from {video_path}, total_frames {total_frames}")
        return {
            "face_presence": 0,
            "eye_contact": 0,
            "blink_count": 0,
            "blink_rate": 0,
            "movement_indicator": 50,
            "delivery_score": 0,
            "frames_analyzed": 0,
            "error": "No frames could be analyzed — video may be unsupported"
        }

    face_presence_ratio = (face_present / sampled) * 100 if sampled else 0
    eye_contact_ratio = (eye_contact_hits / max(1, face_present)) * 100 if face_present else 0

    # Blink rate: blinks per minute estimated
    # Estimate duration from sampled frames: sampled * sample_every / fps
    duration_est = (sampled * sample_every) / max(1, fps)
    blink_rate = (blink_count / max(0.1, duration_est)) * 60 if duration_est > 0 else 0
    # Normalize blink_rate to score: ideal 15-30 blinks/min => 80-90, too high/low penalize slightly but don't over-penalize normal blinking per §34
    if 12 <= blink_rate <= 30:
        blink_score = 85
    elif 8 <= blink_rate <= 40:
        blink_score = 70
    else:
        blink_score = 55

    # Movement indicator: average displacement per frame, lower is more stable, but moderate movement is normal
    avg_movement = movement_sum / max(1, sampled)
    # Normalize: avg_movement 0-5 pixels stable => 85, 5-15 moderate => 70, >25 high movement => 45
    if avg_movement < 5:
        movement_score = 85
    elif avg_movement < 12:
        movement_score = 72
    elif avg_movement < 25:
        movement_score = 58
    else:
        movement_score = 42

    # Delivery score weighted: face_presence 0.35, eye_contact 0.35, movement 0.20, blink stability 0.10
    # But if face_presence <30, delivery is low regardless (poor visibility)
    delivery_score = (
        0.35 * face_presence_ratio +
        0.35 * eye_contact_ratio +
        0.20 * movement_score +
        0.10 * blink_score
    )
    delivery_score = max(0, min(100, round(delivery_score)))

    return {
        "face_presence": int(round(face_presence_ratio)),
        "eye_contact": int(round(eye_contact_ratio)),
        "blink_count": int(blink_count),
        "blink_rate": int(round(blink_rate)),
        "movement_indicator": int(movement_score),
        "delivery_score": delivery_score,
        "frames_analyzed": sampled,
        "face_present_frames": face_present,
        "total_sampled": sampled,
        "duration_est": round(duration_est, 1),
    }

def cleanup_file(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except: pass
