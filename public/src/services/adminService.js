import { API, headers } from "../config/api";

export const getUsers = () =>
  fetch(`${API}/api/admin/users`, { headers }).then(res => res.json());

export const getStats = () =>
  fetch(`${API}/api/admin/stats`, { headers }).then(res => res.json());

export const getEmployees = () =>
  fetch(`${API}/api/employees`, { headers }).then(res => res.json());