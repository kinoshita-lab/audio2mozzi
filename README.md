# audio2mozzi

A web application for converting audio files to Mozzi wavetables

## Overview

audio2mozzi is a tool for converting audio files into wavetable format (C header files) that can be used with [Mozzi](https://github.com/sensorium/Mozzi), an audio synthesis library for Arduino.

## Features

- Upload audio files via web browser
- Convert RAW (headerless) signed 8-bit PCM files to Mozzi header files
- Download converted files

## Requirements

- uv https://github.com/astral-sh/uv
- SoX (Sound eXchange) - for audio file conversion

## Installation

1. Clone the repository
```bash
git clone https://github.com/kinoshita-lab/audio2mozzi
cd wav2mozzi
```

2. Install dependencies (using uv)
```bash
uv sync
```

3. Install SoX
```bash
# Ubuntu/Debian
sudo apt-get install sox

# macOS
brew install sox
```

windows:
- Download SoX from: https://sourceforge.net/projects/sox/
- Download libmad-0.dll  libmp3lame-0.dll if you need to convert mp3 files

## Usage

1. Start the application
```bash
uv run python main.py
```

2. Open your browser and navigate to `http://localhost:5000`

3. Upload and convert audio files

## Project Structure

```
audio2mozzi/
├── main.py           # Flask application
├── char2mozzi.py     # Conversion script(from mozzi)
├── templates/        # HTML templates
├── static/           # CSS/JS files
└── uploads/          # Temporary upload storage
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.