export interface ContainerAttachEvent {
  Type: 'container';
  Action: 'attach';
  Actor: {
    ID: string; // 'e4f10530566425bad3a831b74bad11aa23cc5f349bda15e7bd424347b9228c1f';
    Attributes: {
      image: string; // 'ubuntu';
      name: string; // 'wonderful_meninsky';
    };
  };
  status: 'attach';
  id: string; // 'e4f10530566425bad3a831b74bad11aa23cc5f349bda15e7bd424347b9228c1f';
  from: string; // 'ubuntu';
  scope: string; // 'local';
  time: number; // 1545125810;
  timeNano: number; // 1545125810069436200;
}

export interface ContainerCreateEvent {
  Type: 'container';
  Action: 'create';
  Actor: {
    ID: string; // 'f0c4bbab8c35b4eb70a2a6c81e48989ce1d4a2f39aa472e8d69c28b9b3d49241'
    Attributes: {
      image: string; // 'gcr.io/etcd-development/etcd:v3.2.24'
      name: string; // 'labs_etcd_1'
      [label: string]: string;
    };
  };
  status: 'create';
  id: string; // 'f0c4bbab8c35b4eb70a2a6c81e48989ce1d4a2f39aa472e8d69c28b9b3d49241'
  from: string; // 'gcr.io/etcd-development/etcd:v3.2.24'
  scope: string; // 'local'
  time: number; // 1545122820
  timeNano: number; // 1545122820331673000
}

export interface ContainerDestroyEvent {
  Type: 'container';
  Action: 'destroy';
  Actor: {
    ID: string; // '09bb6a93e827580d49c454d8b33112edfc8cb8eea749506c8da9603a193c1804'
    Attributes: {
      image: string; // 'ubuntu'
      name: string; // 'kind_shirley'
    };
  };
  status: 'destroy';
  id: string; // '09bb6a93e827580d49c454d8b33112edfc8cb8eea749506c8da9603a193c1804'
  from: string; // 'ubuntu'
  scope: string; // 'local'
  time: number; // 1545118672
  timeNano: number; // 1545118672243190800
}

export interface ContainerDieEvent {
  Type: 'container';
  Action: 'die';
  Actor: {
    ID: string; // '09bb6a93e827580d49c454d8b33112edfc8cb8eea749506c8da9603a193c1804'
    Attributes: {
      exitCode: string; // '0'
      image: string; // 'ubuntu'
      name: string; // 'kind_shirley'
      [label: string]: string;
    };
  };
  status: 'die';
  id: string; // '09bb6a93e827580d49c454d8b33112edfc8cb8eea749506c8da9603a193c1804'
  from: string; // 'ubuntu'
  scope: string; // 'local'
  time: number; // 1545118671
  timeNano: number; // 1545118671859759000
}

export interface ContainerKillEvent {
  Type: 'container';
  Action: 'kill';
  Actor: {
    ID: string; // '0342df4db188c1c3676b4b70279b07455ace871b23447bbf44ce44b7e603d974';
    Attributes: {
      // 'com.awesome-labs.config': '{"image":"mongo:4.0","expose":[27017],"type":"Service","name":"mongodb","links":[],"ports":{},"volumes":{}}';
      // 'com.awesome-labs.schema': 'labs';
      // 'com.awesome-labs.service': 'mongodb';
      // 'com.docker.compose.config-hash': '991c4454ef1b2957af6c6f9d7cdd5b784cd1ea75140a213f254285f92a4aeab2';
      // 'com.docker.compose.container-number': '1';
      // 'com.docker.compose.oneoff': 'False';
      // 'com.docker.compose.project': 'labs';
      // 'com.docker.compose.service': 'mongodb';
      // 'com.docker.compose.version': '1.23.2';
      image: string; // 'mongo:4.0';
      name: string; // 'labs_mongodb_1';
      signal: string; // '15';
      [label: string]: string;
    };
  };
  status: 'kill';
  id: string; // '0342df4db188c1c3676b4b70279b07455ace871b23447bbf44ce44b7e603d974';
  from: string; // 'mongo:4.0';
  scope: string; // 'local';
  time: number; // 1545123476;
  timeNano: number; // 1545123476908113400;
}

export interface ContainerRenameEvent {
  Type: 'container';
  Action: 'rename';
  Actor: {
    ID: string; // '0342df4db188c1c3676b4b70279b07455ace871b23447bbf44ce44b7e603d974';
    Attributes: {
      // 'com.awesome-labs.config': '{"image":"mongo:4.0","expose":[27017],"type":"Service","name":"mongodb","links":[],"ports":{},"volumes":{}}';
      // 'com.awesome-labs.schema': 'labs';
      // 'com.awesome-labs.service': 'mongodb';
      // 'com.docker.compose.config-hash': '991c4454ef1b2957af6c6f9d7cdd5b784cd1ea75140a213f254285f92a4aeab2';
      // 'com.docker.compose.container-number': '1';
      // 'com.docker.compose.oneoff': 'False';
      // 'com.docker.compose.project': 'labs';
      // 'com.docker.compose.service': 'mongodb';
      // 'com.docker.compose.version': '1.23.2';
      image: string; // 'mongo:4.0';
      name: string; // '0342df4db188_labs_mongodb_1';
      oldName: string; // '/labs_mongodb_1';
      [label: string]: string;
    };
  };
  status: 'rename';
  id: string; // '0342df4db188c1c3676b4b70279b07455ace871b23447bbf44ce44b7e603d974';
  from: string; // 'mongo:4.0';
  scope: string; // 'local';
  time: number; // 1545123477;
  timeNano: number; // 1545123477612879000;
}

export interface ContainerResizeEvent {
  Type: 'container';
  Action: 'resize';
  Actor: {
    ID: string; // 'e4f10530566425bad3a831b74bad11aa23cc5f349bda15e7bd424347b9228c1f';
    Attributes: {
      height: string; // '35';
      image: string; // 'ubuntu';
      name: string; // 'wonderful_meninsky';
      width: string; // '187';
    };
  };
  status: 'resize';
  id: string; // 'e4f10530566425bad3a831b74bad11aa23cc5f349bda15e7bd424347b9228c1f';
  from: string; // 'ubuntu';
  scope: string; // 'local';
  time: number; // 1545125810;
  timeNano: number; // 1545125810572963300;
}

export interface ContainerStartEvent {
  Type: 'container';
  Action: 'start';
  Actor: {
    ID: string; // 'f0c4bbab8c35b4eb70a2a6c81e48989ce1d4a2f39aa472e8d69c28b9b3d49241'
    Attributes: {
      // 'com.awesome-labs.schema': 'labs';
      // 'com.awesome-labs.service': 'etcd';
      // 'com.awesome-labs.spec': '{"image":"gcr.io/etcd-development/etcd:v3.2.24","command":["/usr/local/bin/etcd","--name","etcd","--data-dir","/etcd-data","--advertise-client-urls","http://0.0.0.0:2379","--listen-client-urls","http://0.0.0.0:2379","--initial-advertise-peer-urls","http://0.0.0.0:2380","--listen-peer-urls","http://0.0.0.0:2380","--initial-cluster","etcd=http://0.0.0.0:2380"],"expose":[2379,2380],"ports":{"2379":"2379"},"type":"Service","name":"etcd","links":[],"volumes":{}}';
      // 'com.docker.compose.config-hash': '9348770f68f7d2dbf2209922d05d814c766e97dc53a828b55e491383d9587345';
      // 'com.docker.compose.container-number': '1';
      // 'com.docker.compose.oneoff': 'False';
      // 'com.docker.compose.project': 'labs';
      // 'com.docker.compose.service': 'etcd';
      // 'com.docker.compose.version': '1.23.2';
      image: string; // 'gcr.io/etcd-development/etcd:v3.2.24'
      name: string; // 'labs_etcd_1'
      [label: string]: string;
    };
  };
  status: 'start';
  id: string; // 'f0c4bbab8c35b4eb70a2a6c81e48989ce1d4a2f39aa472e8d69c28b9b3d49241'
  from: string; // 'gcr.io/etcd-development/etcd:v3.2.24'
  scope: string; // 'local'
  time: number; // 1545122821
  timeNano: number; // 1545122821000000000
}

export interface ContainerStopEvent {
  Type: 'container';
  Action: 'stop';
  Actor: {
    ID: string; // '0342df4db188c1c3676b4b70279b07455ace871b23447bbf44ce44b7e603d974'
    Attributes: {
      // 'com.awesome-labs.config': '{"image":"mongo:4.0","expose":[27017],"type":"Service","name":"mongodb","links":[],"ports":{},"volumes":{}}';
      // 'com.awesome-labs.schema': 'labs';
      // 'com.awesome-labs.service': 'mongodb';
      // 'com.docker.compose.config-hash': '991c4454ef1b2957af6c6f9d7cdd5b784cd1ea75140a213f254285f92a4aeab2';
      // 'com.docker.compose.container-number': '1';
      // 'com.docker.compose.oneoff': 'False';
      // 'com.docker.compose.project': 'labs';
      // 'com.docker.compose.service': 'mongodb';
      // 'com.docker.compose.version': '1.23.2';
      image: string; // 'mongo:4.0'
      name: string; // 'labs_mongodb_1'
      [label: string]: string;
    };
  };
  status: 'stop';
  id: string; // '0342df4db188c1c3676b4b70279b07455ace871b23447bbf44ce44b7e603d974'
  from: string; // 'mongo:4.0'
  scope: string; // 'local'
  time: number; // 1545123477
  timeNano: number; // 1545123477603482600
}

export type ContainerEvent =
  | ContainerAttachEvent
  | ContainerCreateEvent
  | ContainerDestroyEvent
  | ContainerDieEvent
  | ContainerKillEvent
  | ContainerRenameEvent
  | ContainerResizeEvent
  | ContainerStartEvent
  | ContainerStopEvent;

export interface NetworkConnectEvent {
  Type: 'network';
  Action: 'connect';
  Actor: {
    ID: string; // '36340eea2ed509f032f917d344656a1756514cbd59d91ff3fc15f25f0ea69234'
    Attributes: {
      container: string; // 'f0c4bbab8c35b4eb70a2a6c81e48989ce1d4a2f39aa472e8d69c28b9b3d49241'
      name: string; // 'labs_default'
      type: string; // 'bridge'
    };
  };
  scope: string; // 'local'
  time: number; // 1545122820
  timeNano: number; // 1545122820438426600
}

export interface NetworkDisconnectEvent {
  Type: 'network';
  Action: 'disconnect';
  Actor: {
    ID: string; // '8cdddcb2c707a40296b4c7c85a562e5d508206fc42a36b5e71893522b5b53566'
    Attributes: {
      container: string; // '09bb6a93e827580d49c454d8b33112edfc8cb8eea749506c8da9603a193c1804'
      name: string; // 'bridge'
      type: string; // 'bridge'
    };
  };
  scope: string; // 'local'
  time: number; // 1545118672
  timeNano: number; // 1545118672131528200
}

export type NetworkEvent = NetworkConnectEvent | NetworkDisconnectEvent;

export interface VolumeCreateEvent {
  Type: 'volume';
  Action: 'create';
  Actor: {
    ID: string; // 'labs_node_modules';
    Attributes: {
      driver: string; // 'local';
    };
  };
  scope: string; // 'local';
  time: number; // 1545123479;
  timeNano: number; // 1545123479423945000;
}

export interface VolumeDestroyEvent {
  Type: 'volume';
  Action: 'destroy';
  Actor: {
    ID: string; // '0de869a44a51d225f24cb7a2ec87f532'
    Attributes: {
      driver: string; // 'local'
    };
  };
  scope: string; // 'local'
  time: number; // 1545121821
  timeNano: number; // 1545121821482100200
}

export interface VolumeMountEvent {
  Type: 'volume';
  Action: 'mount';
  Actor: {
    ID: string; // 'labs_node_modules';
    Attributes: {
      container: string; // '716f18505f6dbaad347328c51abf31abac0d9df228aba33302ac0b3e9563cc5d';
      destination: string; // '/usr/src/app/node_modules';
      driver: string; // 'local';
      propagation: string; // '';
      'read/write': string; // 'true';
    };
  };
  scope: string; // 'local';
  time: number; // 1545123479;
  timeNano: number; // 1545123479564802300;
}

export type VolumeEvent = VolumeCreateEvent | VolumeDestroyEvent;

export type DockerEvent = ContainerEvent | NetworkEvent | VolumeEvent;
