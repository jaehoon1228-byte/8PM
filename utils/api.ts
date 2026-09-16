import axios from 'axios';

// 1. 기본 API 인스턴스 생성
export const api = axios.create({
    // baseURL: 'http://43.200.89.191',
    withCredentials: true, // 🚨 쿠키(Refresh Token)를 백엔드로 보내기 위해 절대적으로 필수인 옵션
});

// 2. 요청(Request) 인터셉터: 모든 API 호출 전에 알아서 헤더에 Access Token을 꽂아줌
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. 응답(Response) 인터셉터: 여기서 '몰래 재발급' 마법이 일어납니다.
api.interceptors.response.use(
    (response) => response, // 성공하면 그대로 통과
    async (error) => {
        const originalRequest = error.config;

        // 401 에러(권한없음/만료)가 발생했고, 아직 재시도를 안 해본 요청이라면?
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // 무한 루프 방지용 꼬리표

            try {
                // 뒤에서 조용히 재발급 API 호출 (이때 HttpOnly 쿠키가 자동으로 넘어감)
                const refreshResponse = await api.post('/api/v1/jwt/refresh', {}, {
                    withCredentials: true 
                });

                // 성공적으로 새 토큰을 받았다면?
                if (refreshResponse.status === 200) {
                    // 응답 헤더에서 새 토큰을 꺼내서 로컬 스토리지 업데이트
                    const newAccessToken = refreshResponse.headers['authorization'].replace('Bearer ', '');
                    localStorage.setItem('accessToken', newAccessToken);

                    // 실패했던 원래 요청의 헤더를 새 토큰으로 갈아끼우고 다시 요청!
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh Token마저 만료되었거나 에러가 났다면 완전한 로그아웃 처리
                console.error('Refresh Token 만료. 재로그인 필요');
                localStorage.removeItem('accessToken');
                window.location.href = '/'; 
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);