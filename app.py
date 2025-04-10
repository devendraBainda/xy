from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
import os
from werkzeug.utils import secure_filename
import time

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load model
try:
    model = load_model('Lung_cancer_prediction.keras')
    class_names = ["Lung Benign Tissue", "Lung Squamous Cell Carcinoma", "Lung Adenocarcinoma"]
    model_loaded = True
except Exception as e:
    print(f"Error loading model: {e}")
    model_loaded = False
    model = None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def predict_image(filepath):
    try:
        img = image.load_img(filepath, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        
        preds = model.predict(img_array)
        predicted_class = np.argmax(preds, axis=1)[0]
        confidence = float(preds[0][predicted_class]) * 100
        
        return {
            'class_id': int(predicted_class),
            'class_name': class_names[predicted_class],
            'confidence': round(confidence, 2)
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html', model_loaded=model_loaded)

@app.route('/upload', methods=['POST'])
def upload_file():
    if not model_loaded:
        return jsonify({'error': 'Model not loaded. Please check server logs.'}), 500
        
    if 'files[]' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('files[]')
    
    if not files or files[0].filename == '':
        return jsonify({'error': 'No files selected'}), 400
    
    results = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Add a small delay to simulate processing time
            time.sleep(0.5)
            
            # Get prediction
            prediction = predict_image(filepath)
            if prediction:
                results.append({
                    'filename': filename,
                    'filepath': f'/static/uploads/{filename}',
                    'class_name': prediction['class_name'],
                    'confidence': prediction['confidence'],
                    'is_benign': 'Benign' in prediction['class_name']
                })
            else:
                results.append({
                    'filename': filename,
                    'filepath': f'/static/uploads/{filename}',
                    'error': 'Failed to process this image'
                })
        else:
            return jsonify({'error': f'Invalid file format. Allowed formats: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    return jsonify({'results': results})

@app.route('/results')
def results():
    return render_template('results.html')

if __name__ == '__main__':
    app.run(debug=True)