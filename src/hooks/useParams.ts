import { Router, useRouter } from 'next/router';
import { useCallback, useMemo, useRef } from 'react';
type ParamOptionTypes =
  | 'string'
  | 'string[]'
  | 'number'
  | 'number[]'
  | 'boolean';

interface ParamOptionBase<TType extends ParamOptionTypes> {
  type: TType;
  default?: inferParamType<TType>;
}

export type format<T> = {
  [k in keyof T]: T[k];
};
type inferParamType<TParamType extends ParamOptionTypes> =
  TParamType extends 'string'
    ? string
    : TParamType extends 'string[]'
    ? string[]
    : TParamType extends 'number'
    ? number | undefined
    : TParamType extends 'number[]'
    ? number[]
    : TParamType extends 'boolean'
    ? boolean
    : unknown;

function typecast(value: unknown, type: ParamOptionTypes) {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (type.startsWith('string')) {
    return String(value);
  }
  if (type.startsWith('number')) {
    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }
  }
  if (type === 'boolean') {
    return value === 'true' || value === true;
  }

  return undefined;
}

function toArray<TValue>(value: TValue) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return String(value).split('_');
  }
  return [];
}

type TransitionOptions = NonNullable<Parameters<Router['replace']>[2]>;

export interface UseQueryParamsOptions {
  type?: 'replace' | 'push';
  transitionOptions?: TransitionOptions;
}

export function isEqual(a: unknown, b: unknown) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && !a.some((v, index) => v !== b[index]);
  }
  return a === b;
}

type ParamOptionType =
  | ParamOptionBase<'boolean'>
  | ParamOptionBase<'number'>
  | ParamOptionBase<'number[]'>
  | ParamOptionBase<'string'>
  | ParamOptionBase<'string[]'>;

export function useParams<
  TParams extends Record<string, ParamOptionTypes | ParamOptionType>,
>(_params: TParams, _opts?: UseQueryParamsOptions) {
  type TKeys = keyof TParams & string;
  type TResolvedParams = format<
    {
      [TKey in TKeys]: TParams[TKey] extends ParamOptionTypes
        ? {
            type: TParams[TKey];
            defaultValue: inferParamType<TParams[TKey]>;
          }
        : TParams[TKey] extends ParamOptionBase<infer TType>
        ? {
            type: TParams[TKey]['type'];
            defaultValue: TParams[TKey]['default'] extends inferParamType<TType>
              ? TParams[TKey]['default']
              : inferParamType<TType>;
          }
        : never;
    }
  >;
  type TResult = format<
    {
      [TKey in TKeys]: TParams[TKey] extends ParamOptionTypes
        ? inferParamType<TParams[TKey]>
        : TParams[TKey] extends ParamOptionBase<infer TType>
        ? TParams[TKey]['default'] extends inferParamType<TType>
          ? TParams[TKey]['default']
          : inferParamType<TType>
        : never;
    }
  >;
  type TSetParams = Partial<
    {
      [TKey in keyof TResult]: TResult[TKey] | string | undefined;
    }
  >;

  const router = useRouter();
  const query = router.query;

  const optsRef = useRef(_opts);
  optsRef.current = _opts;
  const paramsRef = useRef(_params);
  paramsRef.current = _params;

  const resolvedParams = useMemo(() => {
    const obj: Record<string, unknown> = {};
    const params = paramsRef.current;
    for (const key in params) {
      const param = params[key];
      const type: ParamOptionTypes =
        typeof param === 'string' ? param : (param as any).type;
      let defaultValue =
        typeof param === 'string' ? undefined : (param as any).default;

      if (typeof defaultValue === 'undefined') {
        if (type.endsWith('[]')) {
          defaultValue = [];
        } else if (type === 'string') {
          defaultValue = '';
        } else if (type === 'boolean') {
          defaultValue = false;
        }
      }
      obj[key] = {
        type,
        defaultValue,
      };
    }

    return obj as TResolvedParams;
  }, []);

  const transform = useCallback(
    (key: TKeys, value: unknown) => {
      const { type, defaultValue } = resolvedParams[key];

      if (typeof value === 'undefined') {
        return defaultValue;
      }

      if (type.endsWith('[]')) {
        return toArray(value)
          .map((v: unknown) => typecast(v, type))
          .filter((v) => typeof v !== 'undefined')
          .filter((v) => v !== '_empty');
      }
      return typecast(value, type);
    },
    [resolvedParams],
  );

  const result = useMemo(() => {
    const values: Record<string, unknown> = {};
    let numDirty = 0;
    for (const k in resolvedParams) {
      const key = k as TKeys;
      const value = transform(key, query[key]);
      values[key] = value;
      if (!isEqual(value, resolvedParams[key].defaultValue)) {
        numDirty++;
      }
    }
    return {
      values: values as TResult,
      numDirty,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, resolvedParams]);

  const getParams = useCallback(
    (newObj: TSetParams) => {
      const newQuery: Record<string, unknown> = {
        ...router.query,
      };

      for (const key in newObj) {
        const raw = newObj[key];
        const value = transform(key, raw);
        const defaultValue = resolvedParams[key].defaultValue;
        if (
          Array.isArray(defaultValue) &&
          Array.isArray(value) &&
          defaultValue.length > 0 &&
          value.length === 0
        ) {
          // edge-case - when defaulting array values we need to have a
          newQuery[key] = '_empty';
        } else if (
          typeof value !== 'undefined' &&
          !isEqual(value, defaultValue)
        ) {
          newQuery[key] = Array.isArray(value) ? value.join('_') : value;
        } else {
          delete newQuery[key];
        }
      }

      return newQuery as TSetParams;
    },
    [router.query, transform, resolvedParams],
  );

  const setParams = useCallback(
    (newObj: TSetParams) => {
      const opts = optsRef.current;
      const newQuery = getParams(newObj);

      router[opts?.type ?? 'push']({ query: newQuery as any }, undefined, {
        scroll: false,
        ...(opts?.transitionOptions ?? {}),
      });
    },
    [getParams, router],
  );

  const resetParams = useCallback(() => {
    const opts = optsRef.current;
    const keys = Object.keys(resolvedParams);
    const newQuery = { ...router.query };
    for (const key in newQuery) {
      if (keys.includes(key)) {
        delete newQuery[key];
      }
    }
    router[opts?.type ?? 'push']({ query: newQuery as any }, undefined, {
      scroll: false,
      ...(opts?.transitionOptions ?? {}),
    });
  }, [resolvedParams, router]);

  return {
    setParams,
    values: result.values,
    resolvedParams,
    getParams,
    resetParams,
    numDirty: result.numDirty,
  };
}
