
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  FileEdit, 
  Trash2, 
  Play, 
  Pause,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ApiService } from '@/services/api';
import { TestSession, testSessionSchema } from '@shared/schema';
import { z } from 'zod';

type TestSessionFormData = z.infer<typeof testSessionSchema>;

interface TestSessionManagementProps {
  userRole: string;
}

export function TestSessionManagement({ userRole }: TestSessionManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/test-sessions'],
    queryFn: () => ApiService.get('/api/test-sessions'),
  });

  const form = useForm<TestSessionFormData>({
    resolver: zodResolver(testSessionSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      duration: 60,
      status: 'draft',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TestSessionFormData) => ApiService.post('/api/test-sessions', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test session created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-sessions'] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create test session",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TestSession> }) => 
      ApiService.put(`/api/test-sessions/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test session updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update test session",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiService.delete(`/api/test-sessions/${id}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test session deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete test session",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'draft':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-3 h-3" />;
      case 'draft':
        return <FileEdit className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'archived':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const handleStatusChange = (session: TestSession, newStatus: string) => {
    updateMutation.mutate({
      id: session._id!.toString(),
      data: { status: newStatus as any },
    });
  };

  const handleEdit = (session: TestSession) => {
    setSelectedSession(session);
    form.reset({
      title: session.title,
      description: session.description || '',
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      status: session.status,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (session: TestSession) => {
    if (confirm('Are you sure you want to delete this test session? This will also delete all related questions and attempts.')) {
      deleteMutation.mutate(session._id!.toString());
    }
  };

  const onSubmit = (data: TestSessionFormData) => {
    if (selectedSession) {
      updateMutation.mutate({
        id: selectedSession._id!.toString(),
        data,
      });
      setIsEditModalOpen(false);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading test sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-indigo-900">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
              Test Session Management
            </CardTitle>
            {(userRole === 'admin' || userRole === 'superadmin') && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Session
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-indigo-900 mb-2">No Test Sessions</h3>
              <p className="text-indigo-600 mb-4">Get started by creating your first test session</p>
              {(userRole === 'admin' || userRole === 'superadmin') && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Session
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session: TestSession) => (
                <Card key={session._id?.toString()} className="border-2 hover:border-indigo-300 transition-colors bg-white">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-slate-900 text-lg">{session.title}</h3>
                        <Badge className={`${getStatusColor(session.status)} flex items-center gap-1`}>
                          {getStatusIcon(session.status)}
                          {session.status.toUpperCase()}
                        </Badge>
                      </div>

                      {session.description && (
                        <p className="text-slate-600 text-sm line-clamp-2">{session.description}</p>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-slate-600">
                          <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                          {new Date(session.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-slate-600">
                          <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                          {session.startTime} - {session.endTime}
                        </div>
                        <div className="flex items-center text-slate-600">
                          <Users className="w-4 h-4 mr-2 text-indigo-500" />
                          {session.duration} minutes
                        </div>
                      </div>

                      {(userRole === 'admin' || userRole === 'superadmin') && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(session)}
                            className="flex-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          >
                            <FileEdit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          
                          {session.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(session, 'active')}
                              className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Activate
                            </Button>
                          )}
                          
                          {session.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(session, 'completed')}
                              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(session)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedSession(null);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-indigo-900">
              {selectedSession ? 'Edit Test Session' : 'Create Test Session'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-slate-700 font-medium">Session Title</Label>
              <Input
                id="title"
                placeholder="e.g., React Fundamentals Test"
                className="border-slate-200 focus:border-indigo-500"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-700 font-medium">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this test covers..."
                rows={3}
                className="border-slate-200 focus:border-indigo-500 resize-none"
                {...form.register('description')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-slate-700 font-medium">Date</Label>
                <Input
                  id="date"
                  type="date"
                  className="border-slate-200 focus:border-indigo-500"
                  {...form.register('date')}
                />
                {form.formState.errors.date && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="duration" className="text-slate-700 font-medium">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="300"
                  className="border-slate-200 focus:border-indigo-500"
                  {...form.register('duration', { valueAsNumber: true })}
                />
                {form.formState.errors.duration && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.duration.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-slate-700 font-medium">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  className="border-slate-200 focus:border-indigo-500"
                  {...form.register('startTime')}
                />
                {form.formState.errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.startTime.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endTime" className="text-slate-700 font-medium">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  className="border-slate-200 focus:border-indigo-500"
                  {...form.register('endTime')}
                />
                {form.formState.errors.endTime && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-slate-700 font-medium">Status</Label>
              <Select 
                value={form.watch('status')} 
                onValueChange={(value) => form.setValue('status', value as any)}
              >
                <SelectTrigger className="border-slate-200 focus:border-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedSession(null);
                  form.reset();
                }}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selectedSession ? 'Update Session' : 'Create Session'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
