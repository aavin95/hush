import torchaudio

file_path = "temp/5a851f6d4664bf46d5f60fdc3c77b177.wav"

try:
    print(torchaudio.list_audio_backends())
    waveform, sample_rate = torchaudio.load(file_path)
    print(f"Waveform shape: {waveform.shape}, Sample rate: {sample_rate}")
except Exception as e:
    print(f"Error loading audio file: {e}")
