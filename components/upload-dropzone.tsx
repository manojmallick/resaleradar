'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ScanState = 'idle' | 'identifying' | 'valuing' | 'done' | 'error'

export function UploadDropzone() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const processFile = useCallback(
    (file: File) => {
      setErrorMsg(null)

      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please upload an image file (JPG, PNG, HEIC, etc.)')
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        setPreview(dataUrl)

        try {
          // 1. Identify the item from the photo (Claude vision on Bedrock).
          setScanState('identifying')
          const idRes = await fetch('/api/identify', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              imageBase64: dataUrl,
              mediaType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            }),
          })
          const idJson = await idRes.json()
          if (!idRes.ok) throw new Error(idJson.error ?? 'Could not identify this item.')

          // 2. Value it: pgvector comparable search + velocity aggregation.
          setScanState('valuing')
          const valRes = await fetch('/api/value', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ itemId: idJson.itemId }),
          })
          if (!valRes.ok) {
            const j = await valRes.json()
            throw new Error(j.error ?? 'Could not value this item.')
          }

          setScanState('done')
          router.push(`/results/${idJson.itemId}`)
        } catch (err) {
          setErrorMsg((err as Error).message)
          setScanState('idle') // let the user retry; the prompt reappears
        }
      }
      reader.readAsDataURL(file)
    },
    [router]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleClear = () => {
    setScanState('idle')
    setPreview(null)
    setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isLoading = scanState === 'identifying' || scanState === 'valuing'

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload item photo"
        onClick={() => !isLoading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !isLoading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          'min-h-64 flex flex-col items-center justify-center text-center p-8',
          dragOver
            ? 'border-[#10B981] bg-[#ECFDF5]'
            : 'border-[#10B981]/40 bg-white hover:border-[#10B981] hover:bg-[#ECFDF5]/50',
          isLoading && 'cursor-default pointer-events-none'
        )}
      >
        {/* Faded preview behind loading states */}
        {preview && (
          <img
            src={preview}
            alt="Uploaded preview"
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity',
              isLoading ? 'opacity-20' : 'opacity-0'
            )}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          {scanState === 'idle' && (
            <>
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#10B981]" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#10B981]" />
                </div>
              </div>
              <div>
                <p className="text-[#06281E] font-semibold text-lg">Snap a photo to value your item</p>
                <p className="text-[#6b7f78] text-sm mt-1">
                  Drag &amp; drop, click to browse, or use your camera
                </p>
              </div>
            </>
          )}

          {scanState === 'identifying' && (
            <>
              <Loader2 className="w-10 h-10 text-[#10B981] animate-spin" />
              <p className="text-[#06281E] font-semibold">Identifying your item with vision AI&hellip;</p>
            </>
          )}

          {scanState === 'valuing' && (
            <>
              <Loader2 className="w-10 h-10 text-[#10B981] animate-spin" />
              <p className="text-[#06281E] font-semibold">
                Searching comparable sold items with pgvector&hellip;
              </p>
            </>
          )}
        </div>

        {/* Clear button */}
        {preview && scanState === 'idle' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleClear() }}
            className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 z-20"
            aria-label="Clear photo"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <p className="mt-2 text-sm text-red-600 text-center">{errorMsg}</p>
      )}

      {/* Honest data note */}
      <p className="mt-4 text-xs text-center text-[#6b7f78] leading-relaxed px-4">
        eBay values are live from eBay&apos;s official API. Poshmark and Depop are estimated from comparable
        eBay sold data — and labeled as such.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleChange}
        aria-hidden="true"
      />
    </div>
  )
}
