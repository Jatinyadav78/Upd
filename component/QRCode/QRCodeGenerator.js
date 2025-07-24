// "use client"


// import React, { useEffect, useState } from 'react';
// import QRCode from 'qrcode.react';

// const QRCodeGenerator = ({permitNumber}) => {
//   const [qrValue, setQrValue] = useState('')

//   useEffect(()=>{
//     // Create the correct URL that matches the routing structure
//     // The URL should point to the status page with the permit number
//     let baseUrl;
    
//     if (typeof window !== 'undefined') {
//       // Client-side: use current origin
//       baseUrl = window.location.origin;
//     } else {
//       // Server-side: use environment variable or default
//       baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
//     }
    
//     const directUrl = `${baseUrl}/status/${permitNumber}`;
//     console.log('Generated QR URL:', directUrl); // Debug log
//     setQrValue(directUrl);
//   },[permitNumber])
  
//   return (
//     <div>
//      {qrValue && <QRCode
//         value={qrValue}
//         size={160}
//         level="M"
//         includeMargin={true}
//       />}
//     </div>
//   );
// };

// export default QRCodeGenerator;




"use client";

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';

const QRCodeGenerator = ({ permitNumber }) => {
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    
    if (permitNumber && typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      const directUrl = `${baseUrl}/status/${permitNumber}`;
      console.log('Generated QR URL:', directUrl);
      setQrValue(directUrl);
    }
  }, [permitNumber]);

  return (
    <div style={{ textAlign: 'center', padding: '10px' }}>
      {qrValue ? (
        <QRCode
          value={qrValue}
          size={160}
          level="M"
          includeMargin={true}
        />
      ) : (
        <p>Generating QR Code...</p>
      )}
    </div>
  );
};

export default QRCodeGenerator;
