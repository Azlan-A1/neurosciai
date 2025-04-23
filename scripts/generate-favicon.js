const fs = require('fs');
const { createCanvas } = require('canvas');
const { convert } = require('convert-svg-to-png');

async function generateFavicon() {
  // If you don't want to use the component above, use this SVG instead
  const svgString = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M16,4C10.5,4,6,8.5,6,14c0,4.4,2.9,8.2,7,9.5v1c0,0.8,0.7,1.5,1.5,1.5h3c0.8,0,1.5-0.7,1.5-1.5v-1
    c4.1-1.3,7-5.1,7-9.5C26,8.5,21.5,4,16,4z M16,22c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8S20.4,22,16,22z" fill="#8B5CF6"/>
    <path d="M20.5,11c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5S21.3,11,20.5,11z" fill="#8B5CF6"/>
    <path d="M11.5,11c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5S12.3,11,11.5,11z" fill="#8B5CF6"/>
    <path d="M16,17c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,17,16,17z" fill="#8B5CF6"/>
    <path d="M13,13.5c0-0.8-0.7-1.5-1.5-1.5S10,12.7,10,13.5s0.7,1.5,1.5,1.5S13,14.3,13,13.5z" fill="#8B5CF6"/>
    <path d="M19,13.5c0-0.8-0.7-1.5-1.5-1.5S16,12.7,16,13.5s0.7,1.5,1.5,1.5S19,14.3,19,13.5z" fill="#8B5CF6"/>
  </svg>`;
  
  // Convert SVG to PNG
  const png = await convert(svgString, {
    width: 32,
    height: 32,
  });
  
  // Save the PNG
  fs.writeFileSync('./public/brain-favicon.png', png);
  console.log('Favicon generated!');
}

generateFavicon(); 