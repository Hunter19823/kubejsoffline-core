package pie.ilikepiefoo.kubejsoffline.testclasses;

public interface EventExample<T> {

    T invoker();

    void register(T listener);

    void unregister(T listener);

    boolean isRegistered(T listener);

    void clearListeners();
}
