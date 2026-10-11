export function StatusNotice({
  message,
  error = false,
}: {
  message?: string | null;
  error?: boolean;
}) {
  return message ? (
    <div
      className={"notice " + (error ? "notice-error" : "")}
      role={error ? "alert" : "status"}
    >
      {message}
    </div>
  ) : null;
}
