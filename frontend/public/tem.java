public class tem {

    public static int climbStairs(int n) {
        // Base case: if there's only 1 step, there's only 1 way to climb it
        if (n == 1) {
            return 1;
        }

        int p1 = 1; // Ways to reach the step 2 steps below
        int p2 = 2; // Ways to reach the step 1 step below

        // Start from step 3 up to n
        for (int i = 3; i <= n; i++) {
            int current = p1 + p2; // Ways to reach current step
            p1 = p2; // Shift p1 forward
            p2 = current; // Shift p2 forward
        }

        return p2;
    }

    public static void main(String[] args) {
        // Test cases
        for (int i = 0; i < 20; i++) {
            System.out.println("Ways to climb "+i+"stairs: " + climbStairs(i)); // Output: 8

        }
    }
}