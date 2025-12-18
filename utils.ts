
import { KeyValue, HttpRequest, LoggedRequest } from './types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const getMethodColor = (method?: string): string => {
  const m = method?.toUpperCase() || '';
  switch (m) {
    case 'GET': return 'text-green-600';
    case 'POST': return 'text-yellow-600';
    case 'PUT': return 'text-blue-600';
    case 'DELETE': return 'text-red-600';
    case 'PATCH': return 'text-purple-600';
    case 'OPTIONS': return 'text-indigo-600';
    case 'HEAD': return 'text-teal-600';
    default: return 'text-gray-600';
  }
};

export const getMethodBadgeColor = (method?: string): string => {
    const m = method?.toUpperCase() || '';
    switch (m) {
        case 'GET': return 'bg-green-100 text-green-700';
        case 'POST': return 'bg-yellow-100 text-yellow-700';
        case 'PUT': return 'bg-blue-100 text-blue-700';
        case 'DELETE': return 'bg-red-100 text-red-700';
        case 'PATCH': return 'bg-purple-100 text-purple-700';
        case 'OPTIONS': return 'bg-indigo-100 text-indigo-700';
        case 'HEAD': return 'bg-teal-100 text-teal-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export const generateCurl = (log: LoggedRequest): string => {
  let curl = `curl -X ${log.method} '${log.url}'`;
  
  if (log.requestHeaders) {
    Object.entries(log.requestHeaders).forEach(([key, value]) => {
      // Exclude chrome specific or internal headers if necessary, but usually cURL copy includes all
      curl += ` \\\n  -H '${key}: ${value}'`;
    });
  }
  
  if (log.requestBody) {
    let body = log.requestBody;
    if (typeof body === 'object') {
      body = JSON.stringify(body);
    }
    // Simple escaping for single quotes in body if it's a string for bash compatibility
    const escapedBody = String(body).replace(/'/g, "'\\''");
    curl += ` \\\n  --data-raw '${escapedBody}'`;
  }
  
  return curl;
};

export const parseCurl = (curlCommand: string): Partial<HttpRequest> | null => {
  if (!curlCommand || !curlCommand.trim().toLowerCase().startsWith('curl')) return null;

  // 1. Preprocess: Remove backslashes followed by newlines to make it a single line
  const cleanCommand = curlCommand
    .replace(/\\\r?\n/g, ' ') 
    .replace(/[\r\n]+/g, ' ') 
    .trim();

  const request: Partial<HttpRequest> = {
    headers: [],
    method: 'GET',
    bodyType: 'raw',
    bodyRaw: ''
  };

  const urlMatch = cleanCommand.match(/curl\s+(?:-[a-zA-Z-]+\s+)*['"]([^'"]+)['"]/);
  const simpleUrlMatch = cleanCommand.match(/curl\s+(?:-[a-zA-Z-]+\s+)*([^\s"'-]+)/);

  if (urlMatch) {
    request.url = urlMatch[1];
  } else if (simpleUrlMatch) {
    request.url = simpleUrlMatch[1];
  }

  const methodMatch = cleanCommand.match(/-X\s+([A-Z]+)/);
  if (methodMatch) {
      request.method = methodMatch[1] as any;
  }

  const headerRegex = /-H\s+(['"])(.*?)\1/g;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(cleanCommand)) !== null) {
    const headerContent = headerMatch[2];
    const separatorIndex = headerContent.indexOf(':');
    if (separatorIndex > 0) {
        const key = headerContent.substring(0, separatorIndex).trim();
        const value = headerContent.substring(separatorIndex + 1).trim();
        request.headers?.push({ id: generateId(), key, value, enabled: true });
    }
  }

  const dataRegex = /(?:--data-raw|--data|-d)\s+(['"])([\s\S]*?)\1/;
  const dataMatch = cleanCommand.match(dataRegex);
  
  if (dataMatch) {
    request.bodyRaw = dataMatch[2];
    request.bodyType = 'raw';
    if (!methodMatch) {
        request.method = 'POST';
    }
  }

  return request;
};

export const paramsToQueryString = (params: KeyValue[]): string => {
  return params
    .filter(p => p.enabled && p.key)
    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&');
};

export const queryStringToParams = (query: string): KeyValue[] => {
  if (!query) return [];
  return query.split('&').map(pair => {
    const [key, value] = pair.split('=');
    return {
      id: generateId(),
      key: decodeURIComponent(key || ''),
      value: decodeURIComponent(value || ''),
      enabled: true
    };
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatUrl = (urlString: string) => {
    try {
        const url = new URL(urlString);
        return {
            origin: url.origin,
            path: url.pathname + url.search
        };
    } catch (e) {
        return { origin: urlString, path: '' };
    }
};

export const formatTime = (timestamp: number): string => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
};
