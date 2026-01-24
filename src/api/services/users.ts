import { httpClient } from '../httpClient'
import type { User } from '../entities/user.entity'
import type { CreateUserDto } from '../dtos/create-user.dto'
import type { UpdateUserDto } from '../dtos/update-user.dto'

export const usersService = {
    create: (createUserDto: CreateUserDto) => {
        return httpClient.post<User>('/users', createUserDto)
    },

    findAll: () => {
        return httpClient.get<User[]>('/users')
    },

    findOneByEmail: (email: string) => {
        return httpClient.get<User>(`/users/${email}`)
    },

    findOne: (id: number) => {
        return httpClient.get<User>(`/users/${id}`)
    },

    update: (id: number, updateUserDto: UpdateUserDto) => {
        return httpClient.patch<User>(`/users/${id}`, updateUserDto)
    },

    remove: (id: number) => {
        return httpClient.delete<void>(`/users/${id}`)
    },
}
