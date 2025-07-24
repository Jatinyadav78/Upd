import React, { useState, useEffect } from 'react'
import Styles from './profileImage.module.css'
import { api } from '../../../utils';
// import logoImage from "../../../public/camera.svg";
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { formAction } from '../../../store/formSlice.js';
import imageCompression from "browser-image-compression";
import axios from 'axios';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'react-toastify';

const ProfileImage = ({ useForm, trigger, field, sectionName, name }) => {
  const [capturedImages, setCapturedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { label, responseType, placeholder, isRequired, errorMessage } = field;
  const { Controller, control, register, errors, setValue, errorMsg, reset } = useForm
  const hookFormLabel = name ? `${name}${label}` : label;
  const dispatch = useDispatch();
  const showError = (errors[hookFormLabel] || errorMsg) ? true : false;

  // Set max images based on sectionName
  const maxImages = sectionName === "Registration" ? 1 : 4;

  const stateValue = useSelector((state) => {
    const section = state.form.find(obj => obj.sectionName === sectionName);
    const questionObj = name ? section?.responses.find(obj => obj.question === name)?.answer.find(obj => obj.question === label) : section?.responses.find(obj => obj.question === label);
    return questionObj?.answer || null;
  }, shallowEqual);

  const addImage = async (compressedImage) => {
    const formData = new FormData();
    formData.append("image", compressedImage);
    if(sectionName === 'Registration') formData.append('upload', 'person');
    let url = sectionName === 'Registration' ? 'v1/work-permit/organizations/upload-image' : 'v1/safety/upload';
    try {
      const response = await axios.post(
        url,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Image upload error:", error);
    }
  }

  const handleFileChange = async (event) => {
  try {
    setLoading(true);
    const question = label;
    let files = Array.from(event.target.files);

    // Limit by maxImages
    if (capturedImages.length >= maxImages) {
      alert(`You can only upload up to ${maxImages} image${maxImages > 1 ? 's' : ''}.`);
      setLoading(false);
      return;
    }

    // Restrict to available slots
    files = files.slice(0, maxImages - capturedImages.length);
    let uploadedFiles = [];

    for (const file of files) {
      // Always compress before upload
      let fileToUpload;
      try {
        fileToUpload = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1200 });
      } catch (compressionError) {
        toast("Image compression failed. Please try another image.");
        continue;
      }
        // If compressed image still > 2MB, reject
        if (fileToUpload.size > 2 * 1024 * 1024) {
          toast("File size exceeds 2MB after compression. Please select a smaller image.");
          continue; // Skip to next file
        }
      // Local preview (using original file, not compressed)
      const src = URL.createObjectURL(file);
      setCapturedImages(prev => [...prev, src]);
      // Upload compressed image
      const response = await addImage(fileToUpload);
      let answer;
      if (sectionName === 'Registration') {
        answer = api + response?.data;
      } else {
        answer = response?.data?.data;
      }
      uploadedFiles.push(answer);
    }
    // For Registration, keep only one image
    if (sectionName === 'Registration' && uploadedFiles.length) {
      uploadedFiles = uploadedFiles[0];
    }
    const multiple = sectionName !== 'Registration';
    // Dispatch image(s) to Redux
    name
      ? dispatch(formAction.updateMatrixField({ name, sectionName, question, answer: uploadedFiles }))
      : dispatch(formAction.updateField({ sectionName, question, answer: uploadedFiles, multiple }));
    setLoading(false);
  } catch (error) {
    setLoading(false);
    console.error("Error in processing image:", error);
  }
};

  const removeImage = async (index) => {
    setLoading(true);
    try {
      let answerArr = Array.isArray(stateValue) ? [...stateValue] : stateValue ? [stateValue] : [];
      const question = label;
      // Get the image path to delete
      const imagePath = answerArr[index];
      if (!imagePath) {
        setLoading(false);
        return;
      }
      // Remove from UI immediately
      setCapturedImages(prev => prev.filter((_, i) => i !== index));
      // Remove from Redux after API
      let url, reqBody;
      if (sectionName === 'Registration') {
        url = api + 'v1/work-permit/organizations/delete-image';
        reqBody = { imagePath };
      } else {
        url = api + 'v1/safety/delete-image';
        reqBody = { imagePath };
      }
      await axios.post(url, reqBody);
      // Remove from Redux state
      answerArr.splice(index, 1);
      let newAnswer = sectionName === 'Registration' ? (answerArr[0] || '') : answerArr;
      let multiple = sectionName !== 'Registration';
      console.log('answerArr',answerArr);
      if (name) {
        dispatch(formAction.updateMatrixField({ name, sectionName, question, answer: newAnswer }));
      } else {
        dispatch(formAction.updateField({ sectionName, question, answer: newAnswer }));
      }
    } catch (error) {
      toast('Failed to delete image.');
      console.error('Error deleting image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={Styles.body}>
      <div className={Styles.imageContainer} style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <CircularProgress />
          </div>
        )}
        {capturedImages.map((src, index) => (
          <div key={index} className={Styles.imageWrapper}>
            <img
              src={src}
              alt={`Uploaded ${index + 1}`}
            />
            <button 
              type="button" 
              onClick={() => removeImage(index)}
              className={Styles.removeButton}
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}
        
        {capturedImages.length < maxImages && (
        <label
          htmlFor={hookFormLabel}
          className={Styles.uploadButton}
            style={{ cursor: 'pointer', opacity: 1 }}
        >
          <AddPhotoAlternateIcon style={{ fontSize: 40, color: '#666' }} />
          <span>Add Photo</span>
          {sectionName === 'FIR - First Incidence Report' ? 
          <input
            type="file"
            id={hookFormLabel}
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
            multiple={maxImages > 1}
            {...(maxImages > 1 ? { max: maxImages - capturedImages.length } : {})}
          /> 
          :
          <input
            type="file"
            id={hookFormLabel}
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileChange}
            multiple={maxImages > 1}
            {...(maxImages > 1 ? { max: maxImages - capturedImages.length } : {})}
          />}
        </label>
        )}
      </div>
    </div>
  )
}

export default ProfileImage




 


