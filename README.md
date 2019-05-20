Sometimes, you want to fetch data by userId, but you have to strip the duplicated id. That's very fussy. Now you can use this plugin.

## Installation

```bash
yarn add react-fetch-queue

# 或者

npm install react-fetch-queue --save
```

## Usage
```typescript jsx
import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Queue } from 'react-fetch-queue';
import { fetchDataAction } from '../xxx';

const myQueue = new Queue({
  property: 'id',
  shouldInsert: (props: Props) => !props.data,
  onFetch: (props, ids) => ids.map((id) => props.fetchData(id)),
});

interface Props {
  id: number;
  fetchData: (id: number) => Promise;
  data: Array<{ id: number, name: string }>;
}

const UserName: FunctionComponent<Props> = (props) => {
  myQueue.insert(props.id);
  
  if (!props.data) {
    return <span>--</span>;
  }
  
  return <span>{props.data.name}</span>;
};

const mapStateToProps = (state, ownProps: Props) => {
  return {
    data: state.xxxData.find((item) => item.id === ownProps.id),
  };
};

const mapDispatchToProps = {
  fetchData: fetchDataAction,
};

export const connect(mapStateToProps, mapDispatchToProps)(UserName);
```

## Options
### property: string
The class collect your value of this property, and throw out when invoking method `onFetch(props, keys)`

### shouldInsert(props): boolean
Enable or disable the behavior that insert property_value from props.

### onFetch(props, keys): Promise | Promise[]
Run Action in proper time.
