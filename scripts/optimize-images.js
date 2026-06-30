import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const targets = [
  {
    inputDir: 'src/img/project_img',
    outputDir: 'src/img/project_img/optimized',
    width: 1600,
    quality: 78,
  },
  {
    inputDir: 'src/img/past',
    outputDir: 'src/img/past/optimized',
    width: 1600,
    quality: 78,
  },
  {
    inputDir: 'src/img',
    outputDir: 'src/img/optimized',
    width: 1000,
    quality: 80,
  },
]

const imageExtensions = /\.(png|jpg|jpeg)$/i

for (const target of targets) {
  if (!fs.existsSync(target.inputDir)) {
    console.log(`skip: ${target.inputDir} not found`)
    continue
  }

  fs.mkdirSync(target.outputDir, { recursive: true })

  const files = fs.readdirSync(target.inputDir).filter((file) => {
    const filePath = path.join(target.inputDir, file)
    return fs.statSync(filePath).isFile() && imageExtensions.test(file)
  })

  for (const file of files) {
    const inputPath = path.join(target.inputDir, file)
    const outputName = file.replace(imageExtensions, '.webp')
    const outputPath = path.join(target.outputDir, outputName)

    await sharp(inputPath)
      .resize({
        width: target.width,
        withoutEnlargement: true,
      })
      .webp({
        quality: target.quality,
      })
      .toFile(outputPath)

    const beforeSize = fs.statSync(inputPath).size
    const afterSize = fs.statSync(outputPath).size
    const savedPercent = Math.round((1 - afterSize / beforeSize) * 100)

    console.log(`${file} -> ${outputName} / ${savedPercent}% smaller`)
  }
}