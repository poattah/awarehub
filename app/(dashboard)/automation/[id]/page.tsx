'use client'

export default function AutomationBuilderDisabled({ params }: { params: { id: string } }) {
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-3xl font-bold tracking-tight">Automation builder</h1>
      <p className="text-muted-foreground">
        This automation builder is temporarily disabled while we address dependency deprecations.
      </p>
      <p className="text-sm text-muted-foreground">Project ID: {params.id}</p>
    </div>
  )
}
