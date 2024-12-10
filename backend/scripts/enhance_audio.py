from df.io import load_audio, save_audio
from df import enhance, init_df
import sys
import os

def enhance_audio(input_path, output_path):
    """Enhance audio from the input path and save it to the output path."""
    model, df_state, _ = init_df()
    print(f"input_path: {input_path}")
    print(f"output_path: {output_path}")
    audio, _ = load_audio(input_path, sr=df_state.sr())
    enhanced = enhance(model, df_state, audio)
    print(f"Enhanced audio saved to {output_path}")
    save_audio(output_path, enhanced, df_state.sr())
    return output_path

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    enhance_audio(input_path, output_path)
