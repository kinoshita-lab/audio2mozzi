import os
import uuid
import subprocess
import sys
import io
from contextlib import redirect_stdout, redirect_stderr
from flask import Flask, render_template, request, jsonify, session
from char2mozzi import char2mozzi

app = Flask(__name__)
app.secret_key = os.urandom(24)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size
original_filename = None

def get_sox_version():
    """Get sox version"""
    try:
        result = subprocess.run(['sox', '--version'], check=True, capture_output=True, text=True)
        # The version is usually in the first line of the output
        return result.stdout.strip().split('\n')[0]
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "sox not found or version could not be determined."

@app.route('/')
def home():
    """Home page route"""
    session['session_id'] = str(uuid.uuid4())
    python_version = sys.version
    sox_version = get_sox_version()
    return render_template('index.html', python_version=python_version, sox_version=sox_version)

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file uploads"""
    global original_filename
    
    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No session found'}), 400
        
    session_folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    if not os.path.exists(session_folder):
        os.makedirs(session_folder)
    else:
        # Delete all existing files in the session folder
        for filename in os.listdir(session_folder):
            file_path = os.path.join(session_folder, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    sampling_rate = request.form.get('sampling_rate')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and sampling_rate:
        original_filename = file.filename
        # We don't need to add uuid to filename anymore as it's in a unique folder
        filepath = os.path.join(session_folder, original_filename)
        file.save(filepath)
        
        output_prefix = request.form.get('output_prefix')
        if not output_prefix:
            # Use original filename without extension if not provided
            output_prefix = os.path.splitext(original_filename)[0]

        output_filepath = os.path.join(session_folder, output_prefix + ".raw")
        
        command = [
            'sox', filepath,
            '-r', sampling_rate,
            '-b', '8',
            '-e', 'signed-integer',
            output_filepath
        ]
        
        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            sox_output = result.stdout or result.stderr
            return jsonify({
                'filepath': filepath,
                'original_filename': original_filename,
                'sox_output': sox_output,
                'raw_filepath': output_filepath
            })
        except subprocess.CalledProcessError as e:
            return jsonify({
                'error': 'sox command failed',
                'details': e.stderr
            }), 500
        except FileNotFoundError:
            return jsonify({
                'error': 'sox command not found. Make sure sox is installed and in your PATH.'
            }), 500

    return jsonify({'error': 'Missing file or sampling rate'}), 400

@app.route('/generate', methods=['POST'])
def generate_mozzi():
    """Generate Mozzi wavetable using char2mozzi.py"""
    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No session found'}), 400
        
    data = request.get_json()
    output_prefix = data.get('output_prefix')
    sampling_rate = data.get('sampling_rate')
    
    if not output_prefix or not sampling_rate:
        return jsonify({'error': 'Missing output_prefix or sampling_rate'}), 400
        
    session_folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    
    # Find .raw files in session folder
    raw_files = [f for f in os.listdir(session_folder) if f.endswith('.raw')]
    if not raw_files:
        return jsonify({'error': 'No .raw files found'}), 400
        
    results = []
    for raw_file in raw_files:
        raw_filepath = os.path.join(session_folder, raw_file)
        output_filename = output_prefix + '.h'
        output_filepath = os.path.join(session_folder, output_filename)
        
        # Execute char2mozzi function directly
        try:
            # Capture stdout to get the function's output
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                char2mozzi(raw_filepath, output_filepath, output_prefix, sampling_rate)
            
            char2mozzi_output = stdout_capture.getvalue()
            char2mozzi_error = stderr_capture.getvalue()
            
            # Read the generated .h file content
            h_file_content = ""
            if os.path.exists(output_filepath):
                with open(output_filepath, 'r', encoding='utf-8') as h_file:
                    h_file_content = h_file.read()
                
            results.append({
                'raw_file': raw_file,
                'output_file': output_filename,
                'char2mozzi_output': char2mozzi_output,
                'h_file_content': h_file_content
            })
        except Exception as e:
            results.append({
                'error': f'Failed to process {raw_file}: {str(e)}'
            })
        finally:
            # Delete the raw file regardless of success or failure
            if os.path.exists(raw_filepath):
                os.remove(raw_filepath)
    
    return jsonify({
        'success': True,
        'results': results
    })

if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=5000)
