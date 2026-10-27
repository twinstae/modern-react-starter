/** 대시보드에서 복사한 연결 URL의 비밀번호에 `#`·`&`·`@`가 있어도 URL로 읽히게 한다. */
export function encodeConnectionPassword(url: string): string {
  const schemeEnd = url.indexOf("://") + 3;
  const credentialsEnd = url.lastIndexOf("@");
  if (credentialsEnd < schemeEnd) return url;

  const credentials = url.slice(schemeEnd, credentialsEnd);
  const passwordStart = credentials.indexOf(":");
  if (passwordStart === -1) return url;

  const user = credentials.slice(0, passwordStart);
  const password = credentials.slice(passwordStart + 1);
  return `${url.slice(0, schemeEnd)}${user}:${encodeURIComponent(decodeOnce(password))}${url.slice(credentialsEnd)}`;
}

function decodeOnce(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** 로그에 남길 연결 설명. 비밀번호는 빼고 사용자·호스트·DB 이름만 남긴다. */
export function describeConnection(url: string): string {
  try {
    const { username, host, pathname } = new URL(encodeConnectionPassword(url));
    return `Postgres ${username}@${host}${pathname}`;
  } catch {
    return "Postgres (URL을 읽지 못함)";
  }
}
