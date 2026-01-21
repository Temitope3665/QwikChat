import axios from 'axios';

export const API_URL = 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface User {
  id: string;
  username: string;
  phone: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  last_message: string;
  participant_ids: string;
  created_at: string;
}

export interface RoomResponse {
  room: Room;
  users: User[];
}

export interface Conversation {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const getRooms = async () => {
    const response = await api.get<RoomResponse[]>('/rooms');
    return response.data;
};

export const getUserByPhone = async (phone: string) => {
    const response = await api.get<User>(`/users/phone/${phone}`);
    return response.data;
};

export const createUser = async (username: string, phone: string) => {
    const response = await api.post<User>('/users/create', { username, phone });
    return response.data;
};

export const getConversations = async (roomId: string) => {
  const response = await api.get<Conversation[]>(`/conversations/${roomId}`);
  return response.data;
};

export const getAllUsers = async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
};

export const createRoom = async (name: string, participant_ids: string[]) => {
    const response = await api.post<Room>('/rooms/create', { name, participant_ids });
    return response.data;
};
