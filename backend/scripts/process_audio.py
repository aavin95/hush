import sys
import os
from pydub import AudioSegment
from subprocess import call

def process_audio(input_file, output_file):
    # Pass audio through DeepFilterNet
    print("Test that we hit this in process_audio.py")
    print(f"Processing audio from {input_file} to {output_file}")
    abs_input_path = os.path.abspath(input_file)
    abs_output_path = os.path.abspath(output_file)
    print(f"abs_input_path: {abs_input_path}")
    print(f"abs_output_path: {abs_output_path}")
    try:
        call([
            "python3.11", "scripts/enhance_audio.py", 
            abs_input_path,
            abs_output_path
        ])
    except Exception as e:
        print(f"Error in process_audio: {e}")
        raise

if __name__ == "__main__":
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    process_audio(input_file, output_file)
