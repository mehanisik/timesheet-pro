import { IconDownload } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string | null;
    onDownload: () => void;
}

export function PreviewDialog({
    open,
    onOpenChange,
    url,
    onDownload,
}: PreviewDialogProps) {
    if (!url) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-4 w-[95vw] shadow-2xl rounded-2xl border-border/50 backdrop-blur-3xl bg-background/95 supports-backdrop-filter:bg-background/80">
                <DialogHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <DialogTitle className="text-sm font-medium text-muted-foreground/80">
                        PDF Preview
                    </DialogTitle>
                    <div className="flex gap-2">
                        <Button
                            onClick={onDownload}
                            className="bg-primary/90 hover:bg-primary shadow-lg hover:shadow-primary/20 transition-all font-semibold"
                            size="sm"
                        >
                            <IconDownload className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 rounded-lg border bg-muted/30 overflow-hidden relative group">
                    <iframe
                        title="PDF Preview"
                        src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full rounded-md bg-white opacity-95 group-hover:opacity-100 transition-opacity"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
