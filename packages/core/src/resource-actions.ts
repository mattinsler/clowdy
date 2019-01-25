import * as Resources from './resource-types';

export interface ResourceActionType<
  Resource extends string,
  Type extends string,
  Payload
> {
  is: (
    value: { action: { resource: string; type: string } }
  ) => value is ResourceAction<this>;

  (payload: Payload): {
    action: {
      resource: Resource;
      type: Type;
    };
    payload: Payload;
  };
}

export type ResourceAction<T> = T extends ResourceActionType<
  infer Resource,
  infer Type,
  infer Payload
>
  ? {
      action: {
        resource: Resource;
        type: Type;
      };
      payload: Payload;
    }
  : never;

function createAction<Resource extends string, Type extends string, Payload>(
  resource: Resource,
  type: Type
): ResourceActionType<Resource, Type, Payload> {
  return Object.assign(
    function(
      payload: Payload
    ): ResourceAction<ResourceActionType<Resource, Type, Payload>> {
      return {
        action: { resource, type },
        payload
      };
    },
    {
      is(value: { action: { resource: string; type: string } }) {
        return value.action.resource === resource && value.action.type === type;
      }
    }
  ) as ResourceActionType<Resource, Type, Payload>;
}

export const Actions = {
  Container: {
    create: createAction<
      'Container',
      'Create',
      {
        container: Resources.Container.State.FromSpec;
      }
    >('Container', 'Create'),
    destroy: createAction<
      'Container',
      'Destroy',
      {
        container: Resources.Container.State.FromCluster;
      }
    >('Container', 'Destroy')
  },
  Image: {
    build: createAction<
      'Image',
      'Build',
      { image: Resources.Image.State.FromSpec }
    >('Image', 'Build')
  },
  Network: {
    create: createAction<
      'Network',
      'Create',
      {
        network: Resources.Network.State.FromSpec;
      }
    >('Network', 'Create'),
    destroy: createAction<
      'Network',
      'Destroy',
      {
        network: Resources.Network.State.FromCluster;
      }
    >('Network', 'Destroy')
  },
  Volume: {
    create: createAction<
      'Volume',
      'Create',
      {
        volume: Resources.Volume.State.FromSpec;
      }
    >('Volume', 'Create'),
    destroy: createAction<
      'Volume',
      'Destroy',
      {
        volume: Resources.Volume.State.FromCluster;
      }
    >('Volume', 'Destroy')
  }
};

export namespace ActionTypes {
  export namespace Container {
    export type Create = ResourceAction<typeof Actions.Container.create>;
    export type Destroy = ResourceAction<typeof Actions.Container.destroy>;
  }
  export type Container = Container.Create | Container.Destroy;

  export namespace Image {
    export type Build = ResourceAction<typeof Actions.Image.build>;
  }
  export type Image = Image.Build;

  export namespace Network {
    export type Create = ResourceAction<typeof Actions.Network.create>;
    export type Destroy = ResourceAction<typeof Actions.Network.destroy>;
  }
  export type Network = Network.Create | Network.Destroy;

  export namespace Volume {
    export type Create = ResourceAction<typeof Actions.Volume.create>;
    export type Destroy = ResourceAction<typeof Actions.Volume.destroy>;
  }
  export type Volume = Volume.Create | Volume.Destroy;
}

export type ActionType =
  | ActionTypes.Container
  | ActionTypes.Image
  | ActionTypes.Network
  | ActionTypes.Volume;
