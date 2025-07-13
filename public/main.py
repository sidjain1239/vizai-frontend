# Importing Packages
from flask import Flask, request
from flask_cors import CORS
app = Flask(__name__)
import json
CORS(app)  
# Loading models and processes
from nlp import nlpProcess, nlpModels
from blip import blipLoading, blipProcessing
from groundingDino import groundingDinoLoading, groundingDinoProcessing
from paddleOCR import paddleOCRProcessing
from yolo import yoloLoading,yoloProcessing
from translate import translateLoading,translateProcessing

# Initialising models
clf, embedder = nlpModels()
blipProcessor, blipModel = blipLoading()
gdModel = groundingDinoLoading()
yoloModel = yoloLoading()
translateModel, translateTokenizer = translateLoading()

# Initialising Flask app
@app.route("/")
def home():
    return "✅ Flask is running"


# Update the req route to extract chat_history from request
@app.route("/req", methods=["POST"])
def req():
    try:
        # Receiving Data
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json()
            prompt = data["prompt"]
            # Extract chat history if available
            chat_history = data.get("chat_history", [])
        elif request.form:
            # Extract from form data
            prompt = request.form.get("prompt")
            # Form data might have chat_history as JSON string
            chat_history_str = request.form.get("chat_history", "[]")
            try:
                chat_history = json.loads(chat_history_str)
            except:
                chat_history = []
        else:
            return {"message": "Unsupported content type"}, 415
            
        print("Prompt received:", prompt)
        # Make chat_history available to all models
        data = {"prompt": prompt, "chat_history": chat_history}
        
        # Rest of your code...
        print("Prompt received from JSON:", prompt)
        if "image" not in request.files:
          return {"message": "No image file provided"}, 400
        image = request.files["image"]

        # Predicting perfect model 
        predicted_model = nlpProcess(prompt, clf, embedder)
        print(f"The predicted model for the prompt is: {predicted_model}")

        # If model is 1, run BLIP Captioning
        if predicted_model == 1:
            try:
                print("BLIP Captioning model selected")
                caption = blipProcessing(blipProcessor, blipModel, image)
                return {"success": True, "message": caption,"useLLM":False}
            except Exception as e:
                print("Error in BLIP Captioning:", e)
                return {"success": False, "message": f"Error in BLIP Captioning: {str(e)}"}
            
        # If model is 2, run Grounding DINO

        elif predicted_model == 2:
            try:
                print("Grounding DINO model selected")
                annotatedImagebase64 = groundingDinoProcessing(
                    gdModel=gdModel,
                    image=image,
                    prompt=prompt,
                    box_threshold=0.35,  # Adjust as needed
                    text_threshold=0.25  # Adjust as needed
                )

                return {
                    "success": True,
                    "message": "Grounding DINO processing implemented",
                    "annotated_image": annotatedImagebase64,
                    "useLLM":False
                }
            except Exception as e:
                print("Error in Grounding DINO:", e)
                return {"success": False, "message": f"Error in Grounding DINO: {str(e)}"}
            
        # If model is 3, run LLAMA GeneralQA
        elif predicted_model == 3:
            try:
                print("LLAMA GeneralQA model selected")
           
                return {"useLLM":True,"message":prompt,"systemMeaage":False}
            except Exception as e:
                print("Error in LLAMA GeneralQA:", e)
                return {"success": False, "message": f"Error in LLAMA GeneralQA: {str(e)}"}
        # If model is 4, run PaddleOCR
        elif predicted_model == 4:
            try:
                print("PaddleOCR model selected")
                ocr_response = paddleOCRProcessing(image)
                return {"success": True, "message": ocr_response,"useLLM":False}
            except Exception as e:
                print("Error in PaddleOCR:", e)
                return {"success": False, "message": f"Error in PaddleOCR: {str(e)}"}
        # If model is 5, run PaddleOCR with LLAMA GeneralQA
        elif predicted_model == 5:
            try:
                print("PaddleOCR with LLAMA GeneralQA model selected")
                ocr_response = paddleOCRProcessing(image)
                return {"success": True, "message": prompt,"useLLM":True,"systemMeaage":ocr_response}
            except Exception as e:
                print("Error in PaddleOCR with LLAMA GeneralQA:", e)
                return {"success": False, "message": f"Error in PaddleOCR with LLAMA GeneralQA: {str(e)}"}
        # If model is 6, run PaddleOCR with translation
        elif predicted_model == 6:
            try:
                print("PaddleOCR with translation model selected")
                ocr_response = paddleOCRProcessing(image)
                translated_text = translateProcessing(translateModel,translateTokenizer,ocr_response
                )
                return {
                    "success": True,
                    "message": f'{translated_text}',
                    "useLLM":False
                }
            except Exception as e:
                print("Error in PaddleOCR with translation:", e)
                return {"success": False, "message": f"Error in PaddleOCR with translation: {str(e)}"}

        # If model is 7, run YOLO
        elif predicted_model == 7:
            try:
                print("YOLO model selected")
                yolo_response = yoloProcessing(yoloModel, image)
                return {
                    "success": True,
                    "message": yolo_response["message"],
                    "detections": yolo_response["detections"],
                    "annotated_image": yolo_response["annotated_image"],
                    "useLLM":False
                }
            except Exception as e:
                print("Error in YOLO:", e)
                return {"success": False, "message": f"Error in YOLO: {str(e)}"}
            
        # If model is 8, run YOLO with BLIP Captioning and LLAMA Image QA
        elif predicted_model == 8:
            try:
                print("YOLO with BLIP Captioning and LLAMA Image QA model selected")
                yolo_response = yoloProcessing(yoloModel, image)
                annotated_image = yolo_response["annotated_image"]
                caption = blipProcessing(blipProcessor, blipModel, annotated_image)
                return {
                    "success": True,
                    "message": prompt,
                    "systemMeaage":f"{caption} .YOLO objects {', '.join([d['label'] for d in yolo_response['detections']])}",
                   
                    "useLLM":True
                }
            except Exception as e:
                print("Error in YOLO with BLIP Captioning and LLAMA Image QA:", e)
                return {"success": False, "message": f"Error in YOLO with BLIP Captioning and LLAMA Image QA: {str(e)}"}
        else:
            return {"success": True, "message": str(predicted_model)}
    except Exception as e:
        print(f"Error processing request: {e}")
        return {"success": False, "message": f"Error processing request: {str(e)}"}, 400

if __name__ == "__main__":
    app.run(port=5000, debug=True)
