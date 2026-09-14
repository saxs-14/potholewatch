import numpy as np
from app.detection import detect_potholes, classify_severity, analyze_image


def test_detect_potholes_zero_on_uniform_frame():
    frame = np.full((300, 300, 3), 180, dtype=np.uint8)
    count, coverage, confidence = detect_potholes(frame)
    assert count == 0
    assert confidence == 0.0


def test_detect_potholes_finds_dark_blob_on_light_road():
    frame = np.full((300, 300, 3), 180, dtype=np.uint8)
    frame[120:180, 120:180] = 20  # dark blob simulating a pothole
    count, coverage, confidence = detect_potholes(frame)
    assert count >= 1
    assert confidence > 0


def test_classify_severity_scales_with_count_and_coverage():
    assert classify_severity(0, 0) == "none"
    assert classify_severity(1, 0.5) == "minor"
    assert classify_severity(6, 5.0) == "severe"


def test_analyze_image_returns_expected_keys():
    frame = np.full((300, 300, 3), 180, dtype=np.uint8)
    result = analyze_image(frame)
    for key in ["pothole_count", "coverage_pct", "confidence", "severity"]:
        assert key in result
