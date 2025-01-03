from df.io import load_audio, save_audio
from df import enhance, init_df
import sys
import os

def enhance_audio(input_path, output_path):
    """Enhance audio from the input path and save it to the output path."""
    print("Test that we hit this in enhance_audio.py")
    model, df_state, _ = init_df()
    print(f"input_path: {input_path}")
    print(f"output_path: {output_path}")
    try:
        try:
            audio, _ = load_audio(input_path, sr=df_state.sr())
        except Exception as e:
            print(f"Error in load_audio: {e}")
            raise
        try:
            enhanced = enhance(model, df_state, audio)
        except Exception as e:
            print(f"Error in enhance: {e}")
            raise
        try:
            print(f"Enhanced audio saved to {output_path}")
            save_audio(output_path, enhanced, df_state.sr())
        except Exception as e:
            print(f"Error in save_audio: {e}")
            raise
    except Exception as e:
        print(f"Error in enhance_audio: {e}")
        raise

    if os.path.exists(output_path):
        print(f"Enhanced file size: {os.path.getsize(output_path)} bytes")
    else:
        print("Output file does not exist right after save_audio.")

    return output_path

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    enhance_audio(input_path, output_path)
