import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Shield, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { ApiService } from '@/services/api';
import { User } from '@shared/schema';
import * as XLSX from 'xlsx';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['trainee', 'admin']),
});

const editUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['trainee', 'admin', 'superadmin']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateUserData = z.infer<typeof createUserSchema>;
type EditUserData = z.infer<typeof editUserSchema>;

export function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => ApiService.get('/api/users'),
  });

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'trainee',
    },
  });

  const editForm = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'trainee',
      password: '',
      confirmPassword: '',
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => ApiService.post('/api/users', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: EditUserData }) => 
      ApiService.put(`/api/users/${userId}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      editForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const promoteUserMutation = useMutation({
    mutationFn: (userId: string) => 
      ApiService.put(`/api/users/${userId}`, { role: 'superadmin' }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User promoted to superadmin successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsPromoteModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to promote user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => ApiService.delete(`/api/users/${userId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserData) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: EditUserData) => {
    if (selectedUser) {
      const submitData = { ...data };
      // Only include password if it's being changed
      if (!data.password) {
        delete submitData.password;
        delete submitData.confirmPassword;
      } else {
        delete submitData.confirmPassword; // Don't send confirmPassword to server
      }
      editUserMutation.mutate({ userId: selectedUser.id, data: submitData });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowPasswordFields(false);
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role as 'trainee' | 'admin' | 'superadmin',
      password: '',
      confirmPassword: '',
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handlePromoteUser = (user: User) => {
    setSelectedUser(user);
    setIsPromoteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const confirmPromote = () => {
    if (selectedUser) {
      promoteUserMutation.mutate(selectedUser.id);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'trainee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToExcel = () => {
    const exportData = users.map((user: User) => ({
      'Name': user.name,
      'Email': user.email,
      'Role': user.role.charAt(0).toUpperCase() + user.role.slice(1),
      'Created Date': new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      'Status': 'Active'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    const fileName = `users_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>User Management</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              size="sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-700 w-full sm:w-auto" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create New User</span>
                <span className="sm:hidden">Create User</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={(value) => form.setValue('role', value as 'trainee' | 'admin')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trainee">Trainee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.role && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.role.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter temporary password"
                    {...form.register('password')}
                  />
                  {form.formState.errors.password && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>

          {/* Edit User Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter full name"
                    {...editForm.register('name')}
                  />
                  {editForm.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="Enter email address"
                    {...editForm.register('email')}
                  />
                  {editForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select onValueChange={(value) => editForm.setValue('role', value as 'trainee' | 'admin' | 'superadmin')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trainee">Trainee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {editForm.formState.errors.role && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.role.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="reset-password"
                      checked={showPasswordFields}
                      onChange={(e) => {
                        setShowPasswordFields(e.target.checked);
                        if (!e.target.checked) {
                          editForm.setValue('password', '');
                          editForm.setValue('confirmPassword', '');
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="reset-password" className="text-sm">Reset Password</Label>
                  </div>
                </div>

                {showPasswordFields && (
                  <>
                    <div>
                      <Label htmlFor="edit-password">New Password</Label>
                      <Input
                        id="edit-password"
                        type="password"
                        placeholder="Enter new password"
                        {...editForm.register('password')}
                      />
                      {editForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="edit-confirm-password">Confirm New Password</Label>
                      <Input
                        id="edit-confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        {...editForm.register('confirmPassword')}
                      />
                      {editForm.formState.errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editUserMutation.isPending}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {editUserMutation.isPending ? 'Updating...' : 'Update User'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Modal */}
          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Confirm Delete
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Are you sure you want to delete user "{selectedUser?.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    disabled={deleteUserMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Promote Confirmation Modal */}
          <Dialog open={isPromoteModalOpen} onOpenChange={setIsPromoteModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center text-orange-600">
                  <Shield className="w-5 h-5 mr-2" />
                  Promote to Super Admin
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Are you sure you want to promote "{selectedUser?.name}" to Super Admin? 
                  This will give them full system access.
                </p>
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsPromoteModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmPromote}
                    disabled={promoteUserMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {promoteUserMutation.isPending ? 'Promoting...' : 'Promote User'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading users...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user: User) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{user.name}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role === 'superadmin' && <Shield className="w-3 h-3 mr-1" />}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === 'superadmin' ? (
                          <span className="text-slate-400 text-sm">Protected</span>
                        ) : (
                          <div className="flex space-x-2">
                            {user.role !== 'superadmin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePromoteUser(user)}
                                className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Promote
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary hover:text-blue-700"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {users.map((user: User) => (
                <Card key={user.id} className="mobile-card">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium text-slate-900">{user.name}</h3>
                          <p className="text-sm text-slate-600 break-all">{user.email}</p>
                        </div>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role === 'superadmin' && <Shield className="w-3 h-3 mr-1" />}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {user.role === 'superadmin' ? (
                          <span className="text-slate-400 text-sm">Protected</span>
                        ) : (
                          <>
                            {user.role !== 'superadmin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePromoteUser(user)}
                                className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 flex-1 sm:flex-none"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Promote
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary hover:text-blue-700 flex-1 sm:flex-none"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-500 hover:text-red-700 flex-1 sm:flex-none"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}