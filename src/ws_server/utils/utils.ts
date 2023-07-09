import { RawData } from 'ws';

export const parseMessage = (raw: RawData) => {
  try {
    const parsed = JSON.parse(raw.toString());
    const type = parsed.type;
    const data = parsed.data ? JSON.parse(parsed.data) : {};

    return { data, type };
  } catch (error) {
    throw new Error(`Error on parse: ${error}`);
  }
};

export const stringlifyMessage = ({ data, type }: any) => {
  try {
    return JSON.stringify({ data: JSON.stringify(data), type, id: 0 });
  } catch (error) {
    throw new Error(`Error on stringlify: ${error}`);
  }
};
