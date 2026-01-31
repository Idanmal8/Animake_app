import ImageTracer from 'imagetracerjs'

// Lottie Interfaces
interface LottieShapeGroup {
    ty: 'gr'
    nm: string
    it: any[]
}

interface LottiePath {
    ty: 'sh'
    ks: {
        a: 0
        k: {
            i: [number, number][] // In Tangents
            o: [number, number][] // Out Tangents
            v: [number, number][] // Vertices
            c: boolean // Closed
        }
    }
    nm: string
}

interface LottieFill {
    ty: 'fl'
    c: { a: 0, k: [number, number, number, number] }
    o: { a: 0, k: number }
    nm: string
}

const convertTracedataToLottieShapes = (tracedata: any): LottieShapeGroup[] => {
    const shapes: LottieShapeGroup[] = []
    
    // Safety check for tracedata structure
    if (!tracedata || !tracedata.layers || !tracedata.palette) return shapes
    
    // Imagetracer uses numbered keys for layers (color indices)
    Object.keys(tracedata.layers).forEach((colorIdx) => {
        const layer = tracedata.layers[colorIdx]
        const paths = layer?.paths
        
        // Skip if no paths or no palette color
        if (!paths || !Array.isArray(paths)) return
        
        // Get color from palette
        const paletteColor = tracedata.palette[parseInt(colorIdx)]
        if (!paletteColor) return
        
        // Skip transparent
        if (paletteColor.a === 0) return

        // Create a Group for this color
        const colorGroup: LottieShapeGroup = {
            ty: 'gr',
            nm: `Color ${colorIdx}`,
            it: []
        }

        paths.forEach((path: any) => {
            // Safety check for segments
            if (!path || !path.segments || !Array.isArray(path.segments)) return

            const lottiePath: LottiePath = {
                ty: 'sh',
                nm: 'Path',
                ks: {
                    a: 0,
                    k: {
                        i: [],
                        o: [],
                        v: [],
                        c: true
                    }
                }
            }

            path.segments.forEach((seg: any, i: number) => {
                 if (i === 0) {
                     // For the first segment, we add the start point
                     lottiePath.ks.k.v.push([seg.x1, seg.y1])
                     lottiePath.ks.k.i.push([0, 0])
                     lottiePath.ks.k.o.push([0, 0])
                 }

                 // Determine segment type
                 // Type 1: Line to x2,y2
                 if (seg.type === 1) {
                     lottiePath.ks.k.v.push([seg.x2, seg.y2])
                     lottiePath.ks.k.i.push([0, 0])
                     lottiePath.ks.k.o.push([0, 0])
                 } 
                 // Type 2: Quadratic to x2,y2 with control x1,y1
                 // Lottie uses Cubic Bezier. We can convert Quad to Cubic.
                 // CP1 = P0 + 2/3 (C - P0)
                 // CP2 = P2 + 2/3 (C - P2)
                 else if (seg.type === 2) {
                     const lastV = lottiePath.ks.k.v[lottiePath.ks.k.v.length - 1]
                     if (!lastV) return // Safety check
                     
                     const P0x = lastV[0], P0y = lastV[1]
                     const Cx = seg.x1, Cy = seg.y1
                     const P2x = seg.x2, P2y = seg.y2
                     
                     const CP1x = P0x + (2/3) * (Cx - P0x)
                     const CP1y = P0y + (2/3) * (Cy - P0y)
                     
                     const CP2x = P2x + (2/3) * (Cx - P2x)
                     const CP2y = P2y + (2/3) * (Cy - P2y)
                     
                     // Lottie tangents are relative
                     // Out tangent of previous point
                     const outX = CP1x - P0x
                     const outY = CP1y - P0y
                     lottiePath.ks.k.o[lottiePath.ks.k.o.length - 1] = [outX, outY]
                     
                     // In tangent of new point
                     const inX = CP2x - P2x
                     const inY = CP2y - P2y
                     
                     lottiePath.ks.k.v.push([P2x, P2y])
                     lottiePath.ks.k.i.push([inX, inY])
                     lottiePath.ks.k.o.push([0, 0]) // Placeholder for next
                 }
            })
            
            colorGroup.it.push(lottiePath)
        })

        // Add Fill
        const fill: LottieFill = {
            ty: 'fl',
            nm: 'Fill',
            c: { a: 0, k: [paletteColor.r / 255, paletteColor.g / 255, paletteColor.b / 255, 1] },
            o: { a: 0, k: 100 }
        }
        colorGroup.it.push(fill)
        
        // Add Transform
        colorGroup.it.push({
            ty: 'tr',
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 }
        })

        shapes.push(colorGroup)
    })

    return shapes
}


self.onmessage = (e: MessageEvent) => {
    const { width, height, data, id } = e.data
    try {
        // Reconstruct ImageData
        // Note: ImageTracer expects ImageData object which has { width, height, data }
        const imageData = new ImageData(new Uint8ClampedArray(data), width, height)
        
        // Trace
        // Options: ltres (linear error), qtres (quadratic error), scale, etc.
        // Tweak these for performance vs quality
        const options = {
            ltres: 1,
            qtres: 1,
            pathomit: 8, // Ignore very small paths
            colorsampling: 2, // 0=disabled, 1=random, 2=deterministic
            numberofcolors: 16, // Reduce colors for optimization
            mincolorratio: 0.02,
        }
        
        // Trace to Data (for Lottie)
        const tracedata = ImageTracer.imagedataToTracedata(imageData, options)
        const shapes = convertTracedataToLottieShapes(tracedata)
        
        // Trace to SVG String (for optimized Preview)
        // We reuse the same options
        const svgString = ImageTracer.imagedataToSVG(imageData, options)
        
        self.postMessage({ id, shapes, svgString, success: true })
    } catch (error: any) {
        self.postMessage({ id, success: false, error: 'Worker Error: ' + error.toString() })
    }
}
