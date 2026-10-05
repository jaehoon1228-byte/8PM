export default function BadRequest({ message }: { message?: string }) {
    return (
        <div className="p-5 bg-pink-100 rounded-xl font-bold border-red-400 border-2 text-center mb-5">
            {message ?? "입력한 정보가 일치하지 않습니다."}
        </div>
    );
}
