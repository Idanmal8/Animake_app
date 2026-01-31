import { defineStore } from 'pinia'
import { ref } from 'vue'
import { vectorizationService } from '../../api/services/vectorization'

export interface VectorRect {
    x: number
    y: number
    width: number
    height: number
    color: string // Hex or Rgba
}

// Minimal Lottie Interfaces
export interface LottieAnimation {
  v: string
  fr: number
  ip: number
  op: number
  w: number
  h: number
  nm: string
  ddd: number
  assets: any[]
  layers: LottieLayer[]
  markers: any[]
}

export interface LottieLayer {
  ddd: number
  ind: number
  ty: number // 4 = Shape Layer
  nm: string
  sr: number
  ks: any // Transform
  ao: number
  shapes: any[]
  ip: number
  op: number
  st: number
  bm: number
}

export const useVectorizationStore = defineStore('vectorization', () => {
    const isProcessing = ref(false)

    /**
     * Sends the frame to the Backend for vectorization.
     * No client-side processing is performed.
     */
    const traceFrame = async (imageData: ImageData): Promise<any[]> => {
       // Convert ImageData to Blob
       const canvas = document.createElement('canvas')
       canvas.width = imageData.width
       canvas.height = imageData.height
       const ctx = canvas.getContext('2d')
       if (!ctx) throw new Error("Canvas context creation failed")
       
       ctx.putImageData(imageData, 0, 0)
       
       return new Promise((resolve, reject) => {
           canvas.toBlob(async (blob) => {
               if (!blob) return reject("Failed to create blob from frame")
               
               try {
                   // Post to Backend using Service
                   const response: any = await vectorizationService.traceFrame(blob)
                   
                   // FIX: Handle "Double Wrapping" by unwrapping Lottie Object
                   if (response && !Array.isArray(response) && response.layers) {
                       // Aggregate shapes from ALL layers (in case backend splits them)
                       const allShapes = response.layers.reduce((acc: any[], layer: any) => {
                           if (layer.shapes && Array.isArray(layer.shapes)) {
                               return acc.concat(layer.shapes)
                           }
                           return acc
                       }, [])
                       
                       resolve(allShapes)
                   }
                   // Handle Direct Array response
                   else if (Array.isArray(response)) {
                       resolve(response)
                   }
                   // Handle { data: ... } wrapper just in case
                   else if (response && response.data && Array.isArray(response.data)) {
                        resolve(response.data)
                   }
                   else {
                       console.warn("Unexpected backend response format:", response)
                       resolve([])
                   }
               } catch (e) {
                   reject(e)
               }
           }, 'image/png')
       })
    }

    /**
     * Generates a Lottie JSON object from pre-calculated frame shapes.
     * Strategy: Create 1 Shape Layer per Frame, visible only for that frame's duration.
     */
    const generateLottieJSON = (framesShapes: any[][], fps: number, width: number, height: number): LottieAnimation => {
        const layers: LottieLayer[] = []
        
        // Helper: Create a static property (value)
        const val = (k: any) => ({ a: 0, k, ix: 5 })

        framesShapes.forEach((shapes, frameIndex) => {
            layers.push({
                ddd: 0,
                ind: frameIndex + 1,
                ty: 4, // Shape Layer
                nm: `Frame ${frameIndex}`,
                sr: 1,
                ks: { // Layer Transform
                    o: val(100),
                    r: val(0),
                    // FIX: Set Position and Anchor to 0 to match absolute coordinates from tracer
                    p: val([0, 0, 0]),
                    a: val([0, 0, 0]),
                    s: val([100, 100, 100]),
                },
                ao: 0,
                shapes: shapes, // These are the groups returned by worker
                ip: frameIndex,
                op: frameIndex + 1,
                st: frameIndex,
                bm: 0
            })
        })

        return {
            v: "5.5.7",
            fr: fps,
            ip: 0,
            op: framesShapes.length,
            w: width,
            h: height,
            nm: "Animake Export",
            ddd: 0,
            assets: [],
            layers: layers.reverse(), // Top layer is first in array
            markers: []
        }
    }

    return {
        isProcessing,
        traceFrame,
        generateLottieJSON
    }
})
