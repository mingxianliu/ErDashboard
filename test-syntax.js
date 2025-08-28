// 測試語法
const token = 'test';
const headers = {};
if (token) {
  headers['Authorization'] = 'token ' + token;
}
console.log('語法測試通過');