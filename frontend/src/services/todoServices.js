import apiClient from "./services.js";

export default {
  getAll(listId) {
    return apiClient.get(`lists/${listId}/todos`);
  },
  create(listId, data) {
    return apiClient.post(`lists/${listId}/todos`, data);
  },
  update(todoId, data) {
    return apiClient.put(`todos/${todoId}`, data);
  },
  delete(todoId) {
    return apiClient.delete(`todos/${todoId}`);
  },
};
