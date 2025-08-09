package pie.ilikepiefoo.kubejsoffline.testclasses;

public interface ClientEventExample {

    EventExample<ClientEventExample.ClientState> CLIENT_STATE = EventFactoryExample.createEvent(ClientState.class);
    EventExample<ClientEventExample.ClientDoubleState> CLIENT_DOUBLE_STATE = EventFactoryExample.createEvent(ClientDoubleState.class);

    public interface ClientState extends LifecycleEventExample.InstanceState<ClientState> {
    }

    public interface ClientDoubleState extends LifecycleEventExample.NumericState<Double> {
    }
}
