'use client';

import { IconDeviceFloppy, IconDownload, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface Template {
    name: string;
    entries: Record<string, { project: string; hours: string }>;
}

interface TemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: Record<string, Template>;
    onSave: (name: string) => void;
    onLoad: (
        entries: Record<string, { project: string; hours: string }>,
    ) => void;
    onDelete: (id: string) => void;
}

export function TemplateDialog({
    open,
    onOpenChange,
    templates,
    onSave,
    onLoad,
    onDelete,
}: TemplateDialogProps) {
    const [newName, setNewName] = useState('');
    const templateList = Object.entries(templates);

    const handleSave = () => {
        const name = newName.trim();
        if (!name) {
            toast.error('Please enter a template name');
            return;
        }
        onSave(name);
        setNewName('');
        toast.success(`Template "${name}" saved`);
    };

    const handleLoad = (template: Template) => {
        onLoad(template.entries);
        onOpenChange(false);
        toast.success(`Template "${template.name}" loaded`);
    };

    const handleDelete = (id: string, name: string) => {
        onDelete(id);
        toast.success(`Template "${name}" deleted`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm font-semibold">
                        Templates
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Save new template */}
                    <div className="flex gap-2">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="New template name..."
                            className="h-8 text-xs"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                            }}
                        />
                        <Button
                            onClick={handleSave}
                            size="sm"
                            className="h-8 text-xs px-3 shrink-0"
                        >
                            <IconDeviceFloppy className="w-3.5 h-3.5 mr-1.5" />
                            Save
                        </Button>
                    </div>

                    {templateList.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-1 max-h-[240px] overflow-y-auto">
                                {templateList.map(([id, template]) => (
                                    <div
                                        key={id}
                                        className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 group"
                                    >
                                        <span className="text-xs font-medium truncate flex-1">
                                            {template.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                                            {
                                                Object.keys(template.entries)
                                                    .length
                                            }{' '}
                                            entries
                                        </span>
                                        <div className="flex gap-1 shrink-0">
                                            <Button
                                                onClick={() =>
                                                    handleLoad(template)
                                                }
                                                variant="ghost"
                                                size="icon"
                                                className="w-7 h-7 opacity-60 hover:opacity-100"
                                                title="Load template"
                                            >
                                                <IconDownload className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    handleDelete(
                                                        id,
                                                        template.name,
                                                    )
                                                }
                                                variant="ghost"
                                                size="icon"
                                                className="w-7 h-7 opacity-60 hover:opacity-100 text-destructive hover:text-destructive"
                                                title="Delete template"
                                            >
                                                <IconTrash className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {templateList.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            No saved templates yet.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
