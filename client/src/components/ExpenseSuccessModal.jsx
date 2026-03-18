import { motion, AnimatePresence } from "framer-motion";

export default function ExpenseSuccessModal({ show }) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-lg text-center max-w-sm mx-4"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="text-green-500 text-5xl mb-3 font-bold"
          >
            ✓
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-900">Expense Added!</h2>
          <p className="text-gray-600 mt-2">Successfully recorded</p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
