import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MainLayoutProps = {
  title?: string
  topLeft?: ReactNode
  topCenter?: ReactNode
  topRight?: ReactNode
  leftPanel?: ReactNode
  children: ReactNode
  onExit?: () => void
  background?: "gradient" | "solid"
  showHeader?: boolean
  showExitButton?: boolean
  contentClassName?: string
  mainClassName?: string
}

export default function MainLayout({
  title = import.meta.env.VITE_APP_NAME || "App",
  topLeft,
  topCenter,
  topRight,
  leftPanel,
  children,
  onExit,
  background = "solid",
  showHeader = true,
  showExitButton = true,
  contentClassName,
  mainClassName,
}: MainLayoutProps) {
  const hasLeftPanel = Boolean(leftPanel)
  const canExit = Boolean(onExit) && showExitButton

  return (
    <div
      className={
        background === "solid"
          ? "min-h-svh bg-background"
          : "min-h-svh bg-[linear-gradient(180deg,var(--primary)_0%,var(--primary)_38%,var(--background)_100%)]"
      }
    >
      {showHeader ? (
        <div className="border-b border-border/30 bg-primary text-primary-foreground">
          <div className="flex h-12 w-full items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">{title}</div>
              {topLeft}
            </div>

            <div className="hidden items-center gap-3 text-xs md:flex">{topCenter}</div>

            <div className="flex items-center gap-3 text-xs">{topRight}</div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "grid w-full grid-cols-1 gap-4 px-3 py-4",
          hasLeftPanel ? "md:grid-cols-[280px_1fr]" : "md:grid-cols-1"
          ,
          contentClassName
        )}
      >
        {hasLeftPanel ? (
          <aside
            className={cn(
              "border border-border/40 bg-card p-4 shadow-sm"
            )}
          >
            {leftPanel}
          </aside>
        ) : null}

        <main
          className={cn(
            "min-h-[70svh] border border-border/40 bg-background p-4 shadow-sm",
            mainClassName
          )}
        >
          {children}

          {canExit ? (
            <div className="mt-6 flex justify-end">
              <Button
                variant="secondary"
                className="h-16 w-full justify-between bg-primary text-primary-foreground hover:bg-primary/90 md:w-80"
                onClick={onExit}
                type="button"
              >
                <div className="text-left">
                  <div className="text-lg font-semibold">Fermer le programme</div>
                  <div className="text-xs text-primary-foreground/80">
                    Quitter l&apos;application
                  </div>
                </div>
                <div className="size-10 bg-primary-foreground/20" />
              </Button>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}
