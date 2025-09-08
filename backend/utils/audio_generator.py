import os
import uuid
import boto3
from config.aws_config import s3_client, S3_BUCKET_NAME, is_aws_configured, get_s3_client_safe

# Make audio processing packages optional
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    print("Warning: gTTS package not available. Audio generation will not work.")

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("Warning: pydub package not available. Audio processing will not work.")

def generate_audio_from_text(text, accent='en', speed=1.0, max_retries=3):
    """Generate audio from text using gTTS with custom accent and speed"""
    if not GTTS_AVAILABLE:
        raise Exception("Audio generation not available - gTTS package is missing. Please install it using: pip install gtts")
    
    if not PYDUB_AVAILABLE:
        raise Exception("Audio generation not available - pydub package is missing. Please install it using: pip install pydub")
    
    # Check if S3 is configured
    s3_available = is_aws_configured()
    
    if not s3_available:
        raise Exception("AWS S3 is not configured. Please set AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION, and AWS_S3_BUCKET environment variables. Audio files can only be stored on AWS S3.")
    
    for attempt in range(max_retries):
        try:
            # Ensure speed is a float to prevent type comparison errors
            try:
                speed = float(speed) if speed is not None else 1.0
            except (ValueError, TypeError):
                speed = 1.0
                print(f"Warning: Invalid speed value '{speed}', using default 1.0")
            
            # Create gTTS object with specified accent
            # Handle deprecated language codes
            if accent == 'en-US':
                accent = 'en'  # gTTS prefers 'en' over 'en-US'
                print(f"⚠️  Language code 'en-US' deprecated, using 'en' instead")
            
            tts = gTTS(text=text, lang=accent, slow=(speed < 1.0))
            
            # Generate temporary file
            temp_filename = f"temp_{uuid.uuid4()}.mp3"
            tts.save(temp_filename)
            
            # Load audio and adjust speed if needed
            audio = AudioSegment.from_mp3(temp_filename)
            if speed != 1.0:
                # Adjust playback speed
                new_frame_rate = int(audio.frame_rate * speed)
                audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_frame_rate})
                audio = audio.set_frame_rate(audio.frame_rate)
            
            # Save adjusted audio
            adjusted_filename = f"adjusted_{uuid.uuid4()}.mp3"
            audio.export(adjusted_filename, format="mp3")
            
            # Upload to AWS S3 (no fallback to local storage)
            current_s3_client = get_s3_client_safe()
            if current_s3_client is None:
                raise Exception("S3 client is not available. Please check AWS configuration.")
            
            s3_key = f"audio/practice_tests/{uuid.uuid4()}.mp3"
            current_s3_client.upload_file(adjusted_filename, S3_BUCKET_NAME, s3_key)
            
            # Clean up temporary files
            try:
                os.remove(temp_filename)
                os.remove(adjusted_filename)
            except Exception as cleanup_error:
                print(f"Warning: Failed to cleanup temporary files: {cleanup_error}")
            
            return s3_key
            
        except Exception as e:
            if "429" in str(e) or "Too Many Requests" in str(e):
                if attempt < max_retries - 1:
                    # Simple retry with short delay
                    wait_time = 2 ** attempt  # 2, 4, 8 seconds
                    print(f"Rate limit hit (attempt {attempt + 1}/{max_retries}). Waiting {wait_time} seconds before retry...")
                    import time
                    time.sleep(wait_time)
                    continue
                else:
                    raise Exception(f"Google TTS API rate limit exceeded after {max_retries} attempts. Please wait a few minutes and try again.")
            elif "gTTS" in str(e):
                raise Exception(f"Text-to-speech conversion failed: {str(e)}. Please check the text content and try again.")
            elif "AudioSegment" in str(e):
                raise Exception(f"Audio processing failed: {str(e)}. Please check if the audio file was generated correctly.")
            elif "S3" in str(e) or "AWS" in str(e):
                raise Exception(f"AWS S3 error: {str(e)}. Please check AWS configuration and try again.")
            else:
                raise Exception(f"Audio generation failed: {str(e)}. Please try again or contact support.")
    
    # If we get here, all retries failed
    raise Exception("Audio generation failed after all retry attempts")

def is_audio_generation_available():
    """Check if audio generation is available"""
    # Audio generation is available if we have the required packages
    # S3 is optional - we can fall back to local storage
    return GTTS_AVAILABLE and PYDUB_AVAILABLE

def get_audio_generation_status():
    """Get detailed status of audio generation capabilities"""
    from config.aws_config import get_aws_status
    
    aws_status = get_aws_status()
    
    # Audio generation is available if we have the required packages
    # S3 is optional - we can fall back to local storage
    fully_available = GTTS_AVAILABLE and PYDUB_AVAILABLE
    
    if fully_available:
        if aws_status['configured']:
            message = 'Audio generation is ready for bulk operations with AWS S3 storage'
        else:
            message = 'Audio generation requires AWS S3 configuration. Please set AWS credentials.'
    else:
        message = 'Audio generation has package issues - missing required dependencies'
    
    return {
        'gtts_available': GTTS_AVAILABLE,
        'pydub_available': PYDUB_AVAILABLE,
        'aws_configured': aws_status['configured'],
        'fully_available': fully_available and aws_status['configured'],  # Only fully available if AWS is configured
        'message': message,
        'aws_status': aws_status,
        'storage_type': 'S3' if aws_status['configured'] else 'Not Available',
        'local_storage_available': False,  # Local storage is disabled
        'recommendation': 'AWS S3 is required for audio generation. Please configure AWS credentials.'
    }

def calculate_similarity_score(original_text, student_audio_text):
    """Calculate similarity score between original and student audio text"""
    try:
        from difflib import SequenceMatcher
        import re
        
        # Clean and normalize text
        def clean_text(text):
            # Remove extra whitespace and punctuation for comparison
            text = re.sub(r'[^\w\s]', '', text.lower())
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        
        original_clean = clean_text(original_text)
        student_clean = clean_text(student_audio_text)
        
        # Calculate character-level similarity using SequenceMatcher
        char_similarity = SequenceMatcher(None, original_clean, student_clean).ratio()
        
        # Calculate word-level accuracy
        original_words = original_clean.split()
        student_words = student_clean.split()
        
        if not original_words:
            return 0.0
        
        # Word-by-word comparison
        correct_words = 0
        total_words = len(original_words)
        
        for i, orig_word in enumerate(original_words):
            if i < len(student_words) and orig_word == student_words[i]:
                correct_words += 1
            elif orig_word in student_words:
                # Partial credit for words that appear but in wrong position
                correct_words += 0.5
        
        word_accuracy = correct_words / total_words
        
        # Calculate word order accuracy
        word_order_score = 0
        if len(student_words) > 0:
            # Check how many words are in the correct position
            min_length = min(len(original_words), len(student_words))
            correct_positions = sum(1 for i in range(min_length) if original_words[i] == student_words[i])
            word_order_score = correct_positions / min_length
        
        # Calculate vocabulary coverage
        original_word_set = set(original_words)
        student_word_set = set(student_words)
        vocabulary_coverage = len(original_word_set.intersection(student_word_set)) / len(original_word_set)
        
        # Weighted final score
        final_score = (
            char_similarity * 0.3 +      # Character-level similarity
            word_accuracy * 0.4 +        # Word accuracy
            word_order_score * 0.2 +     # Word order
            vocabulary_coverage * 0.1    # Vocabulary coverage
        )
        
        return round(final_score * 100, 2)
    except Exception as e:
        print(f"Error calculating similarity: {str(e)}")
        return 0.0

def calculate_detailed_similarity(original_text, student_audio_text):
    """Calculate detailed similarity analysis for speaking modules"""
    try:
        from difflib import SequenceMatcher
        import re
        
        def clean_text(text):
            text = re.sub(r'[^\w\s]', '', text.lower())
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        
        original_clean = clean_text(original_text)
        student_clean = clean_text(student_audio_text)
        
        original_words = original_clean.split()
        student_words = student_clean.split()
        
        # Detailed analysis
        analysis = {
            'overall_score': 0,
            'char_similarity': 0,
            'word_accuracy': 0,
            'word_order_score': 0,
            'vocabulary_coverage': 0,
            'missing_words': [],
            'extra_words': [],
            'mispronounced_words': [],
            'word_by_word': []
        }
        
        # Character-level similarity
        analysis['char_similarity'] = SequenceMatcher(None, original_clean, student_clean).ratio() * 100
        
        # Word-by-word analysis
        for i, orig_word in enumerate(original_words):
            word_analysis = {
                'position': i,
                'original': orig_word,
                'student': student_words[i] if i < len(student_words) else '',
                'correct': False,
                'score': 0
            }
            
            if i < len(student_words):
                if orig_word == student_words[i]:
                    word_analysis['correct'] = True
                    word_analysis['score'] = 100
                else:
                    # Check for partial matches or similar words
                    similarity = SequenceMatcher(None, orig_word, student_words[i]).ratio()
                    word_analysis['score'] = similarity * 100
                    if similarity < 0.8:
                        analysis['mispronounced_words'].append({
                            'original': orig_word,
                            'student': student_words[i],
                            'similarity': similarity
                        })
            else:
                analysis['missing_words'].append(orig_word)
            
            analysis['word_by_word'].append(word_analysis)
        
        # Extra words
        if len(student_words) > len(original_words):
            analysis['extra_words'] = student_words[len(original_words):]
        
        # Calculate scores
        correct_words = sum(1 for w in analysis['word_by_word'] if w['correct'])
        analysis['word_accuracy'] = (correct_words / len(original_words)) * 100 if original_words else 0
        
        # Word order score
        correct_positions = sum(1 for w in analysis['word_by_word'] if w['correct'])
        analysis['word_order_score'] = (correct_positions / len(original_words)) * 100 if original_words else 0
        
        # Vocabulary coverage
        original_set = set(original_words)
        student_set = set(student_words)
        analysis['vocabulary_coverage'] = (len(original_set.intersection(student_set)) / len(original_set)) * 100 if original_set else 0
        
        # Overall score (weighted)
        analysis['overall_score'] = (
            analysis['char_similarity'] * 0.3 +
            analysis['word_accuracy'] * 0.4 +
            analysis['word_order_score'] * 0.2 +
            analysis['vocabulary_coverage'] * 0.1
        )
        
        return analysis
        
    except Exception as e:
        print(f"Error calculating detailed similarity: {str(e)}")
        return {
            'overall_score': 0,
            'char_similarity': 0,
            'word_accuracy': 0,
            'word_order_score': 0,
            'vocabulary_coverage': 0,
            'missing_words': [],
            'extra_words': [],
            'mispronounced_words': [],
            'word_by_word': [],
            'error': str(e)
        }

def transcribe_audio(audio_file_path):
    """Transcribe audio file to text using speech recognition"""
    try:
        # Try to import speech_recognition, but make it optional
        try:
            import speech_recognition as sr
        except ImportError:
            print("Warning: speech_recognition package not available. Audio transcription will not work.")
            return ""
        
        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_file_path) as source:
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)
            return text
    except Exception as e:
        print(f"Error transcribing audio: {str(e)}")
        return "" 