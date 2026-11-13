import apiClient from "./services.js";

export default {
  getAll() {
    return apiClient.get("lists");
  },
  create(data) {
    return apiClient.post("lists", data);
  },
  update(listId, data) {
    return apiClient.put(`lists/${listId}`, data);
  },
  delete(listId) {
    return apiClient.delete(`lists/${listId}`);
  },
};
