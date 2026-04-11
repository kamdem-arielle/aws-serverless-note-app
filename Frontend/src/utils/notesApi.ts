import apiClient from './apiClient';
import { Note } from './types';

interface BackendNote {
  noteId: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const mapNote = (bn: BackendNote): Note => ({
  id: bn.noteId,
  title: bn.title,
  content: bn.content,
  createdAt: bn.createdAt,
  updatedAt: bn.updatedAt,
});

export const fetchNotes = async (): Promise<Note[]> => {
  console.log('[notesApi] Fetching all notes');
  const response = await apiClient.get('/notes');
  const notes: BackendNote[] = response.data.notes;
  console.log('[notesApi] Fetched', notes.length, 'notes');
  return notes.map(mapNote);
};

export const fetchNote = async (id: string): Promise<Note> => {
  console.log('[notesApi] Fetching note:', id);
  const response = await apiClient.get(`/notes/${id}`);
  console.log('[notesApi] Fetched note:', id);
  return mapNote(response.data);
};

export const createNote = async (
  data: Pick<Note, 'title' | 'content'>
): Promise<Note> => {
  console.log('[notesApi] Creating note:', data.title);
  const response = await apiClient.post('/notes', {
    title: data.title,
    content: data.content,
  });
  console.log('[notesApi] Note created:', response.data.note.noteId);
  return mapNote(response.data.note);
};

export const updateNote = async (
  id: string,
  data: Partial<Pick<Note, 'title' | 'content'>>
): Promise<Note> => {
  console.log('[notesApi] Updating note:', id);
  const response = await apiClient.put(`/notes/${id}`, data);
  console.log('[notesApi] Note updated:', id);
  return mapNote(response.data.note);
};

export const deleteNote = async (id: string): Promise<void> => {
  console.log('[notesApi] Deleting note:', id);
  await apiClient.delete(`/notes/${id}`);
  console.log('[notesApi] Note deleted:', id);
};
