import React, {useCallback, useEffect, useMemo} from 'react';
import {SafeAreaView, View, StyleSheet, Button} from 'react-native';

import TaskContext, {Task} from './app/models/Task';
import IntroText from './app/components/IntroText';
import AddTaskForm from './app/components/AddTaskForm';
import TaskList from './app/components/TaskList';
import colors from './app/styles/colors';

/**
 * Crash, Error: Unable to open a realm at path '/data/user/0/io.geoworkforce/files/geo.realm':
 *  Realm file initial open failed: Invalid mnemonic. top_ref[0]: 411F60114140B39E, top_ref[1]: 3A2272657375227B,
 *  mnemonic: 22 73 65 72, fmt[0]: 118, fmt[1]: 105, flags:
 * 65 Path:Exception backtrace: <backtrace not supported on this platform>
 * Path: /data/user/0/io.geoworkforce/files/geo.realm Exception
 * backtrace: <backtrace not supported on this platform>.
 * This error is located at: in f in RCTView in Unknown in RCTView in Unknown in C
 *  , stack: schemaVersion@-1 openDB@887:2067 openDB@1014:606 value@423:3176 f@423:1639 lr@95:31853
 * bl@95:51882 ti@95:78509 ei@95:78437 Za@95:78202 qa@95:75364 qa@-1 <unknown>@95:26064
 * unstable_runWithPriority@192:3806 Ct@95:26011 Pt@95:25946 Oa@95:72858 Pi@95:88019
 * render@95:94758 exports@354:626 run@346:740 runApplication@346:1775 value@49:3492 <unknown>@49:747
 * value@49:2538 value@49:719 value@-1
 */

const {useRealm, useQuery, RealmProvider} = TaskContext;

function App() {
  console.log('rendering App');
  const realm = useRealm();
  //const result = useQuery(Task);

  const tasks = []; //useMemo(() => result.sorted('createdAt'), [result]);

  const handleAddTask = useCallback(
    (description: string): void => {
      if (!description) {
        return;
      }

      // Everything in the function passed to "realm.write" is a transaction and will
      // hence succeed or fail together. A transcation is the smallest unit of transfer
      // in Realm so we want to be mindful of how much we put into one single transaction
      // and split them up if appropriate (more commonly seen server side). Since clients
      // may occasionally be online during short time spans we want to increase the probability
      // of sync participants to successfully sync everything in the transaction, otherwise
      // no changes propagate and the transaction needs to start over when connectivity allows.
      realm.write(() => {
        realm.create('Task', Task.generate(description));
      });
    },
    [realm],
  );

  const handleToggleTaskStatus = useCallback(
    (task: Task): void => {
      realm.write(() => {
        // Normally when updating a record in a NoSQL or SQL database, we have to type
        // a statement that will later be interpreted and used as instructions for how
        // to update the record. But in RealmDB, the objects are "live" because they are
        // actually referencing the object's location in memory on the device (memory mapping).
        // So rather than typing a statement, we modify the object directly by changing
        // the property values. If the changes adhere to the schema, Realm will accept
        // this new version of the object and wherever this object is being referenced
        // locally will also see the changes "live".
        task.isComplete = !task.isComplete;
      });

      // Alternatively if passing the ID as the argument to handleToggleTaskStatus:
      // realm?.write(() => {
      //   const task = realm?.objectForPrimaryKey('Task', id); // If the ID is passed as an ObjectId
      //   const task = realm?.objectForPrimaryKey('Task', Realm.BSON.ObjectId(id));  // If the ID is passed as a string
      //   task.isComplete = !task.isComplete;
      // });
    },
    [realm],
  );

  const handleDeleteTask = useCallback(
    (task: Task): void => {
      realm.write(() => {
        realm.delete(task);

        // Alternatively if passing the ID as the argument to handleDeleteTask:
        // realm?.delete(realm?.objectForPrimaryKey('Task', id));
      });
    },
    [realm],
  );

  useEffect(() => {
    const doStuff = () => {
      console.log('do stuff');
      const itemCount = 10000000;
      if (realm && !realm.isClosed) {
        for (let j = 0; j < itemCount; j++) {
          realm.write(() => {
            for (let i = 0; i < 100; i++) {
              realm.create(Task, Task.generate(`${i}`));
            }
            for (let k = 0; k < 100; k++) {
              const collection = realm.objects(Task);
              collection[k].description = `${j}`;
            }
          });
          if (j % 100 === 0) {
            console.log(`Progress:  ${j * 100} / ${itemCount * 100}`);
            console.log('number of records: ', realm.objects(Task).length);
          }
        }
      }
    };
    setTimeout(doStuff, 1000);
  }, [realm]);

  const deleteStuff = useCallback(() => {
    realm.write(() => {
      realm.deleteAll();
    });
  }, [realm]);

  return (
    <SafeAreaView style={styles.screen}>
      <Button onPress={() => console.log('nothing')} title="Do stuff" />
      <Button onPress={() => deleteStuff()} title="Delete" />
      <View style={styles.content}>
        <AddTaskForm onSubmit={handleAddTask} />
        {tasks.length === 0 ? (
          <IntroText />
        ) : (
          <TaskList
            tasks={tasks}
            onToggleTaskStatus={handleToggleTaskStatus}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.darkBlue,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
});

function AppWrapper() {
  if (!RealmProvider) {
    return null;
  }
  return (
    <RealmProvider>
      <App />
    </RealmProvider>
  );
}

export default AppWrapper;
