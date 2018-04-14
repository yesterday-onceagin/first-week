export default function preLoadImages(images) {
  const preload_images = []
  for (let i = 0; i < images.length; i++) {
    preload_images[i] = new Image()
    preload_images[i].crossOrigin = undefined
    preload_images[i].src = images[i]
  }
}
