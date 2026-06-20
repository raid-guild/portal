'use client'

import React, { useEffect, useId, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'

type MapDialogProps = {
  children: React.ReactNode
  className?: string
  description?: string
  isDismissible?: boolean
  onClose?: () => void
  title: string
}

export const MapDialog: React.FC<MapDialogProps> = ({
  children,
  className,
  description,
  isDismissible = true,
  onClose,
  title,
}) => {
  const descriptionID = useId()
  const titleID = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    const focusFirst = () => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(focusableSelector)
      ;(firstFocusable || dialogRef.current)?.focus()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDismissible) {
        onClose?.()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.offsetParent !== null)

      if (!focusable.length) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    window.setTimeout(focusFirst, 0)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousActiveElement?.focus()
    }
  }, [isDismissible, onClose])

  return (
    <div
      aria-describedby={description ? descriptionID : undefined}
      aria-labelledby={titleID}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-black/80 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
    >
      <div
        className={cn(
          'map-dialog-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-[#1a0d0b] p-1 outline-none',
          className,
        )}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="border border-moloch-500 bg-gradient-to-b from-[#27120f] to-[#0e0706] p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="portal-kicker">RaidGuild Map</p>
              <h2 className="mt-2 portal-heading" id={titleID}>
                {title}
              </h2>
              {description ? (
                <p className="mt-2 portal-body-sm" id={descriptionID}>
                  {description}
                </p>
              ) : null}
            </div>
            {isDismissible ? (
              <Button onClick={onClose} size="sm" type="button" variant="outline">
                Close
              </Button>
            ) : null}
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  )
}
