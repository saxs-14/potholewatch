"""
Pothole detection via classical computer vision (no trained model): adaptive
thresholding + contour analysis to find dark, irregular blobs against the
road surface, filtered by area and shape. This is a legitimate, precedented
baseline technique (pre-dating deep-learning pothole detectors) - it is not
as accurate as a trained model. See README "Limitations".
"""
from typing import Tuple

import cv2
import numpy as np


def detect_potholes(frame: np.ndarray, min_area_fraction: float = 0.0015) -> Tuple[int, float, float]:
    """Returns (pothole_count, coverage_pct, confidence)."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)

    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 8
    )
    kernel = np.ones((5, 5), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    h, w = gray.shape
    frame_area = h * w
    min_area = frame_area * min_area_fraction

    pothole_contours = []
    for c in contours:
        area = cv2.contourArea(c)
        if area < min_area:
            continue
        x, y, cw, ch = cv2.boundingRect(c)
        aspect = cw / ch if ch else 0
        # Potholes are roughly blob-shaped, not long thin cracks or the whole frame border
        if 0.3 < aspect < 3.5 and area < frame_area * 0.5:
            pothole_contours.append(c)

    total_dark_area = sum(cv2.contourArea(c) for c in pothole_contours)
    coverage_pct = round((total_dark_area / frame_area) * 100, 2)
    count = len(pothole_contours)

    # confidence heuristic: more/larger consistent dark blobs -> higher confidence,
    # capped well below 1.0 since this is not a trained classifier
    confidence = min(0.35 + count * 0.08 + coverage_pct * 0.01, 0.85) if count else 0.0

    return count, coverage_pct, round(confidence, 2)


def classify_severity(count: int, coverage_pct: float) -> str:
    if count == 0:
        return "none"
    if coverage_pct < 1.0 and count <= 2:
        return "minor"
    if coverage_pct < 4.0 and count <= 5:
        return "moderate"
    return "severe"


def analyze_image(frame: np.ndarray) -> dict:
    count, coverage_pct, confidence = detect_potholes(frame)
    severity = classify_severity(count, coverage_pct)
    return {
        "pothole_count": count,
        "coverage_pct": coverage_pct,
        "confidence": confidence,
        "severity": severity,
    }
