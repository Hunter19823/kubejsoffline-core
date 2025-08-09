package pie.ilikepiefoo.kubejsoffline.testclasses;

public interface LifecycleEventExample {

    EventExample<Start> START = EventFactoryExample.createEvent(Start.class);

    EventExample<Stop> STOP = EventFactoryExample.createEvent(Stop.class);

    public interface Start {
        void onStart();
    }

    public interface Stop {
        void onStop();
    }

    public interface InstanceState<T> {
        void onState(T state);
    }

    public interface NumericState<T extends Number> {
        void onNumericState(T state);
    }
}
