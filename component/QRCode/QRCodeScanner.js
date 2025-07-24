

// "use client";
// import React, { useRef, useEffect, useState, useCallback } from 'react';
// import Webcam from 'react-webcam';
// import jsQR from 'jsqr';
// import { Button } from '@mui/material';
// import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import { useRouter } from 'next/navigation';

// const styles = {
//   container: {
//     position: 'relative',
//     width: '90%',
//     height: '90%',
//   },
//   webcam: {
//     width: '100%',
//     height: '100%',
//     objectFit: 'cover',
//   },
//   overlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: '100%',
//     height: '100%',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   focus: {
//     width: '60%',
//     height: '60%',
//     border: '2px solid white',
//     backgroundColor: 'transparent',
//   },
// };

// const QRCodeScanner = () => {
//   const webcamRef = useRef(null);
//   const router = useRouter();
//   const [scanResult, setScanResult] = useState(null);
//   const [cameraError, setCameraError] = useState(false);

//   const videoConstraints = {
//     width: 1280,
//     height: 720,
//     facingMode: "environment",
//   };

//   const capture = useCallback(() => {
//     if (webcamRef.current && webcamRef.current.video.readyState === 4) {
//       const video = webcamRef.current.video;
//       const canvas = document.createElement("canvas");
//       const ctx = canvas.getContext("2d");
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;

//       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       const code = jsQR(imageData.data, imageData.width, imageData.height);
      
//       if (code) {
//         setScanResult(code.data);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       capture();
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [capture]);

//   useEffect(() => {
//     if (scanResult) {
//       // Open the scanned URL directly in a new tab
//       window.open(scanResult, '_blank', 'noopener,noreferrer');
//       // Reset scan result after opening
//       setScanResult(null);
//     }
//   }, [scanResult]);

//   const handleCameraError = (err) => {
//     console.error("Camera error:", err);
//     setCameraError(true);
//   };

//   return (
//     <div className="d-flex flex-column justify-content-center align-items-center" style={{ width: "100%", height: "100%" }}>
//       <div style={{ width: '100%', padding: '20px' }}>
//         <Button
//           variant='outlined'
//           startIcon={<ArrowBackIcon />}
//           onClick={() => router.back()}
//           style={{position:'absolute',top:'10px'}}
//         >
//           Back
//         </Button>
//       </div>
//       {cameraError ? (
//         <div style={{ color: "red", padding: "20px", textAlign: "center" }}>
//           Camera access denied. Please allow camera permission to scan QR codes.
//         </div>
//       ) : (
//         <Webcam
//           audio={false}
//           height={"100%"}
//           ref={webcamRef}
//           screenshotFormat="image/jpeg"
//           width={"100%"}
//           videoConstraints={videoConstraints}
//           onUserMediaError={handleCameraError}
//         />
//       )}
//     </div>
//   );
// };

// export default QRCodeScanner;





"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  webcam: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  focusBox: {
    width: '300px',
    height: '300px',
    border: '3px solid lightskyblue',
    borderRadius: '10px',
    boxSizing: 'border-box',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  buttonWrapper: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 3,
  },
  errorText: {
    color: "red",
    padding: "20px",
    textAlign: "center",
    zIndex: 4,
  }
};

const QRCodeScanner = () => {
  const webcamRef = useRef(null);
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [showPermissionPopup, setShowPermissionPopup] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment",
  };

  const capture = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setScanResult(code.data);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      capture();
    }, 1000);

    return () => clearInterval(interval);
  }, [capture]);

  useEffect(() => {
    if (scanResult) {
      window.open(scanResult, '_blank', 'noopener,noreferrer');
      setScanResult(null);
    }
  }, [scanResult]);

  const handleCameraError = (err) => {
    console.error("Camera error:", err);
    setCameraError(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.buttonWrapper}>
        <Button
          variant='outlined'
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>

      {/* Camera Permission Popup */}
      <Dialog open={showPermissionPopup}>
        <DialogTitle>Camera Permission</DialogTitle>
        <DialogContent>
          Camrera access Required  to scan QR codes. Do you allow camera access?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowPermissionPopup(false); }}>Allow</Button>
          <Button onClick={() => { setShowPermissionPopup(false); setPermissionDenied(true); }} color="error">Deny</Button>
        </DialogActions>
      </Dialog>

      {permissionDenied ? (
        <div style={styles.errorText}>
          Camera access denied. Please allow camera permission to scan QR codes.
        </div>
      ) : !showPermissionPopup && !permissionDenied ? (
        cameraError ? (
          <div style={styles.errorText}>
            Camera access denied. Please allow camera permission to scan QR codes.
          </div>
        ) : (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMediaError={handleCameraError}
              style={styles.webcam}
            />
            {/* Overlay frame box */}
            <div style={styles.overlay}>
              <div style={styles.focusBox}></div>
            </div>
          </>
        )
      ) : null}
    </div>
  );
};

export default QRCodeScanner;
