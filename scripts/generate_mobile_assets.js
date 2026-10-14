const sharp = require('sharp');
const fs = require('fs');

async function generate() {
  const userLogoSvg = fs.readFileSync('./frontend/public/logo.svg');
  const businessLogoSvg = fs.readFileSync('./business/public/logo-business.svg');

  // Convert user logo for User App
  console.log("Generating User Assets...");
  
  // Icon: 1024x1024, white bg, scaled logo
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(userLogoSvg).resize(800, null, { fit: 'inside' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile('./mobile/user/assets/icon.png');

  // Splash: 2732x2732, white bg, scaled logo
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(userLogoSvg).resize(1500, null, { fit: 'inside' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile('./mobile/user/assets/splash.png');

  // Convert business logo for Business App
  console.log("Generating Business Assets...");
  
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(businessLogoSvg).resize(800, null, { fit: 'inside' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile('./mobile/business/assets/icon.png');

  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{
    input: await sharp(businessLogoSvg).resize(1500, null, { fit: 'inside' }).toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile('./mobile/business/assets/splash.png');

  console.log("Assets generated!");
}

generate().catch(console.error);

